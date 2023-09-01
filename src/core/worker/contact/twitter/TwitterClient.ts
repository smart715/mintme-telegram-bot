import config from 'config'
import {Logger} from 'winston'
import {By, Key, WebDriver, WebElement} from 'selenium-webdriver'
// eslint-disable-next-line
import {NoSuchElementError} from 'selenium-webdriver/lib/error'
import {ContactMessage, Token, TwitterAccount} from '../../../entity'
import {
    ContactHistoryService,
    ContactMessageService,
    ContactQueueService,
    SeleniumService,
    TokensService,
    TwitterService,
} from '../../../service'
import {Environment, getRandomNumber} from '../../../../utils'
import {ContactHistoryStatusType, ContactMethod, TokenContactStatusType} from '../../../types'

export class TwitterClient {
    private readonly maxMessagesDaily: number = config.get('twitter_dm_limit_daily')
    private readonly maxAttemptsDaily: number = config.get('twitter_total_attempts_daily')
    private readonly messageDelaySec: number = config.get('twitter_messages_delay_in_seconds')
    public message: ContactMessage

    public isInitialized: boolean = false
    public twitterAccount: TwitterAccount
    private sentMessages: number
    private driver: WebDriver

    public constructor(
        twitterAccount: TwitterAccount,
        private readonly twitterService: TwitterService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactQueueService: ContactQueueService,
        private readonly tokenService: TokensService,
        private readonly environment: Environment,
        private readonly logger: Logger,
    ) {
        this.twitterAccount = twitterAccount
    }

    public async init(): Promise<void> {
        await this.createDriver()

        const isLoggedIn = await this.login()

        if (!isLoggedIn) {
            return
        }

        await this.updateSentMessages()
        await this.initMessage()

        this.isInitialized = true
        this.log(`Logged in | 24h Sent messages: ${this.sentMessages}`)
    }

    public isAllowedToSentMessages(): boolean {
        if (this.sentMessages >= this.maxAttemptsDaily || this.sentMessages >= this.maxMessagesDaily) {
            return false
        }

        return true
    }

    private async initMessage(): Promise<void> {
        const contentMessage = await this.contactMessageService.getOneContactMessage()

        if (!contentMessage) {
            return
        }

        this.message = contentMessage

        this.log(`Message content to send: ${this.message.content}`)
    }

    private async updateSentMessages(): Promise<void> {
        this.sentMessages = await this.contactHistoryService.getCountSentTwitterMessagesDaily(this.twitterAccount)
    }

    private async createDriver(): Promise<boolean> {
        this.log(`Creating driver instance`)

        this.driver = await SeleniumService.createDriver('', undefined, this.logger)

        return true
    }

    private async login(retries: number = 1): Promise<boolean> {
        try {
            this.log(`Logging in, Attempt #${retries}`)

            await this.driver.get('https://twitter.com/')
            await this.driver.sleep(10000)

            const cookies: object = JSON.parse(this.twitterAccount.cookiesJSON)

            for (const [ key, value ] of Object.entries(cookies)) {
                await this.driver.executeScript(
                    'document.cookie = `${arguments[0]}=${arguments[1]};path=/`', key, value
                )
            }

            await this.driver.sleep(10000)
            await this.driver.navigate().refresh()
            await this.driver.sleep(30000)

            if (await this.isLoggedIn()) {
                return true
            }

            if (retries < 3) {
                this.log(`Retrying to login, Attempt #${retries}`)
                return await this.login(retries + 1)
            } else {
                this.logger.warn(
                    `[TwitterWorker ${this.twitterAccount.id}] ` +
                    `Account is banned or credentials are wrong, Err: USER_DEACTIVATED. Disabling account`
                )
                await this.disableAccount()

                return false
            }
        } catch (e) {
            this.logger.error(e)
            return false
        }
    }

    private async isLoggedIn(): Promise<boolean> {
        const title = await this.driver.getTitle()

        return title.toLowerCase().includes('home')
    }

    private async disableAccount(): Promise<void> {
        this.twitterAccount.isDisabled = true
        await this.twitterService.setAccountAsDisabled(this.twitterAccount)
    }

    public async startContacting(): Promise<void> {
        while (true) {  // eslint-disable-line
            await this.driver.sleep(getRandomNumber(1, 10) * 1000)

            const queuedContact = await this.contactQueueService.getFirstFromQueue(ContactMethod.TWITTER, this.logger)

            if (!queuedContact) {
                this.log('Queued contact doesn\'t have tokens to contact. Waiting ~5 mins...')

                return
            }

            const token = await this.tokenService.findByAddress(queuedContact.address, queuedContact.blockchain)

            if (!token) {
                await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

                this.log(
                    `No token for ${queuedContact.address} :: ${queuedContact.blockchain} . Skipping and removed contact from queue`
                )

                continue
            }

            if (TokenContactStatusType.RESPONDED === token.contactStatus) {
                await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

                this.log(
                    `token ${queuedContact.address} :: ${queuedContact.blockchain} was marked as responded . Skipping and removed from queue`
                )

                continue
            }

            const result = await this.contactWithToken(
                queuedContact.channel,
                this.buildMessage(token)
            )

            if (ContactHistoryStatusType.DM_NOT_ENABLED === result) {
                this.log(`${queuedContact.channel} doesn't have dm opened`)
            }

            if (ContactHistoryStatusType.ACCOUNT_NOT_EXISTS === result) {
                this.log(`${queuedContact.channel} account doesn't exists or suspended`)
            }

            if (ContactHistoryStatusType.ACCOUNT_LIMIT_HIT === result) {
                await this.contactQueueService.setProcessing(queuedContact, false)

                this.log('Client is not allowed to sent messages. Max daily attempts or daily messages reached.')

                return
            }

            await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

            await this.contactHistoryService.addRecord(
                queuedContact.address,
                queuedContact.blockchain,
                ContactMethod.TWITTER,
                true,
                this.message.id,
                queuedContact.channel,
                result,
                undefined,
                this.twitterAccount.id
            )

            token.lastContactMethod = ContactMethod.TWITTER
            token.lastContactAttempt = new Date()

            await this.tokenService.saveTokenContactInfo(token)

            await this.driver.sleep(this.messageDelaySec * 1000)
        }
    }

    public async contactWithToken(link: string, message: string): Promise<ContactHistoryStatusType> {
        if (!this.isAllowedToSentMessages()) {
            return ContactHistoryStatusType.ACCOUNT_LIMIT_HIT
        }

        this.log(`Trying to contact with ${link}`)

        await this.driver.get(link)
        await this.driver.sleep(20000)

        const mainColumn = await this.driver.findElement(
            By.css(`div[data-testid="primaryColumn"]`)
        )

        const mainText = await mainColumn.getText()

        if (mainText.includes('Account suspended') || mainText.includes('This account doesn’t exist')) {
            return ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
        }

        let element: WebElement

        try {
            element = await this.driver.findElement(
                By.css(`div[data-testid="sendDMFromProfile"]`)
            )
        } catch (err) {
            if (err instanceof NoSuchElementError) {
                return ContactHistoryStatusType.DM_NOT_ENABLED
            }

            throw err
        }

        await element.click()

        await this.driver.sleep(20000)

        this.log(`Dm opened for ${link}. Sending message...`)

        let messageInput: WebElement

        try {
            messageInput = await this.driver.findElement(By.css('div[data-testid="dmComposerTextInput"]'))
        } catch (err) {
            if (err instanceof NoSuchElementError) {
                this.log(`Can't find dm input field. Dm not enabled or account doesn't have access to ${link}`)

                return ContactHistoryStatusType.DM_NOT_ENABLED
            }

            throw err
        }

        await messageInput.sendKeys(message)
        await this.driver.sleep(5000)

        if (this.isProd()) {
            await messageInput.sendKeys(Key.RETURN)

            this.log(`Message sent to ${link}`)
        } else {
            this.log('Environment is not production. Skipping sending message')
        }

        this.sentMessages++

        return ContactHistoryStatusType.SENT_DM
    }

    private buildMessage(token: Token): string {
        return this.message.content
            .replace(/XXXCOINXXX/g, token.name)
            .replace(/XXXBLOCKCHAINXXX/g, token.blockchain)
    }

    public async destroyDriver(): Promise<void> {
        if (this.driver) {
            await this.driver.quit()
        }
    }

    private log(message: string): void {
        this.logger.info(
            `[TwitterWorker ${this.twitterAccount.id}] ` +
            message
        )
    }

    private isProd(): boolean {
        return Environment.PRODUCTION === this.environment
    }
}
