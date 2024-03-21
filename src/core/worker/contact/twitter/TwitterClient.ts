import config from 'config'
import { Logger } from 'winston'
import { By, Key, WebDriver, WebElement } from 'selenium-webdriver'
import { ContactMessage, Token, TwitterAccount } from '../../../entity'
import {
    ContactHistoryService,
    ContactMessageService,
    ContactQueueService,
    SeleniumService,
    TokensService,
    TwitterService,
} from '../../../service'
import { Environment, getRandomNumber } from '../../../../utils'
import { ContactHistoryStatusType, ContactMethod } from '../../../types'
import moment from 'moment'
import { ClientInterface } from '../../ClientInterface'

export class TwitterClient implements ClientInterface {
    private readonly maxMessagesDaily: number = config.get('twitter_dm_limit_daily')
    private readonly maxAttemptsDaily: number = config.get('twitter_total_attempts_daily')
    private readonly messageDelaySec: number = config.get('twitter_messages_delay_in_seconds')
    private readonly unreadDotCss: string = config.get('twitter_css_unread_dot')
    private readonly responsesCheckerFrequency: number = config.get('twitter_responses_checker_frequency_hours')

    private readonly twitterAccount: TwitterAccount
    private message: ContactMessage
    private driver: WebDriver
    private sentMessages: number
    private attempts: number

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

    public async init(): Promise<boolean> {
        await this.initMessage()
        await this.updateSentMessagesAndTotalAttempt()

        if (!this.isAllowedToSendMessages()) {
            this.logger.warn(
                `[TwitterWorker ID: ${this.twitterAccount.id}] ` +
                `Client is not allowed to sent messages. Max daily attempts or daily messages reached. Skipping...`
            )

            if (!this.canRunResponseWorker()) {
                return false
            }
        }

        this.log(`Creating driver instance`)
        this.driver = await SeleniumService.createDriver('', undefined, this.logger)

        const isLoggedIn = await this.login()

        if (!isLoggedIn) {
            this.logger.warn(
                `[TwitterWorker ID: ${this.twitterAccount.id}] not initialized. Can't login. Skipping...`
            )
        }

        this.log(`Logged in | 24h Sent messages: ${this.sentMessages} | 24h Attempts: ${this.attempts}`)

        return true
    }

    private isAllowedToSendMessages(): boolean {
        return !(this.attempts >= this.maxAttemptsDaily || this.sentMessages >= this.maxMessagesDaily)
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

    private async startResponsesFetcher(): Promise<boolean> {
        this.log(`Started getting responses`)
        await this.driver.get(`https://twitter.com/messages`)
        await this.driver.sleep(10000)

        const chatListSeelctor = await this.driver.findElements(By.css('[data-viewportview="true"]'))
        if (!chatListSeelctor.length) {
            this.log(`Couldn't find chat list div`)
            return false
        }

        const chatList = chatListSeelctor[0]

        const dateCheckUntil = moment().utc().subtract(3, 'days').format('MMM D')

        let lastScrollHeight = 0
        let keepChecking = true
        let curentRetries = 0
        let isStartOfChat = true
        while (keepChecking) {
            lastScrollHeight = +(await chatList.getAttribute('scrollHeight'))

            if (!isStartOfChat) {
                this.log(`Scrolling`)

                await this.driver.executeScript(`arguments[0].scrollTo(0, arguments[0].scrollHeight)`, chatList)
                await this.driver.sleep(5000)
            }

            isStartOfChat = false

            const chats = await this.driver.findElements(By.css('[data-testid="conversation"]'))

            for (const chat of chats) {
                const dateSelector = await chat.findElements(By.css('time'))

                if (dateSelector.length) {
                    const dateStr = await dateSelector[0].getText()

                    if (dateCheckUntil.toLocaleLowerCase() === dateStr.toLocaleLowerCase()) {
                        this.log(`Checked chats until ${dateCheckUntil}`)
                        keepChecking = false
                        return true
                    }
                }

                const unreadDotSelector = await chat.findElements(By.className(this.unreadDotCss))

                if (!unreadDotSelector.length) {
                    continue
                }

                const userNameSelector = await chat.findElements(By.css('a'))
                const messageTitleSelector = await chat.findElements(By.css('span'))

                if (userNameSelector.length && messageTitleSelector.length) {
                    const userLink = await userNameSelector[0].getAttribute('href')
                    const message = await messageTitleSelector.pop()?.getText()

                    if (!message || !message.length || !userLink) {
                        continue
                    }

                    await this.twitterService.addNewResponse(message, userLink, this.twitterAccount)
                }
            }

            const currentScrollHeight = +(await chatList.getAttribute('scrollHeight'))

            if (currentScrollHeight === lastScrollHeight) {
                if (curentRetries >= 3) {
                    return true
                } else {
                    curentRetries++
                    continue
                }
            }

            curentRetries = 0
            await this.driver.sleep(1000)
        }

        this.log(`Finished getting responses`)
        return true
    }

    private canRunResponseWorker(): boolean {
        const thresholdDate = moment().subtract(this.responsesCheckerFrequency, 'hours')
        const lastResponsesFetchDate = moment(this.twitterAccount.lastResponsesFetchDate)

        return !lastResponsesFetchDate.isValid() || lastResponsesFetchDate.isBefore(thresholdDate)
    }

    public async startWorker(): Promise<void> {
        while (true) {  // eslint-disable-line
            await this.driver.sleep(getRandomNumber(1, 10) * 1000)

            if (this.canRunResponseWorker()) {
                const responseWorkerResult = await this.startResponsesFetcher()

                if (responseWorkerResult) {
                    await this.twitterService.updateResponsesLastChecked(this.twitterAccount)
                }
            }

            if (!this.isAllowedToSendMessages()) {
                this.log(`Account Limit hit`)
                return
            }

            const queuedContact = await this.contactQueueService.getFirstFromQueue(ContactMethod.TWITTER, this.logger)

            if (!queuedContact) {
                this.log('Queued contact doesn\'t have tokens to contact. Waiting ~5 mins...')

                await this.driver.sleep(300000)

                continue
            }

            const token = await this.tokenService.findByAddress(queuedContact.address)

            if (!token) {
                await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

                this.log(
                    `No token for ${queuedContact.address} :: ${queuedContact.blockchain} . Skipping and removed contact from queue`
                )

                continue
            }

            const isValidQueuedContact = await this.contactQueueService.preContactCheckAndCorrect(
                queuedContact,
                token,
                this.logger)

            if (!isValidQueuedContact) {
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

            this.attempts += 1

            await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

            const isSuccess = ContactHistoryStatusType.SENT_DM === result

            await this.contactHistoryService.addRecord(
                queuedContact.address,
                queuedContact.blockchain,
                ContactMethod.TWITTER,
                isSuccess,
                this.message.id,
                queuedContact.channel,
                result,
                undefined,
                this.twitterAccount.id
            )

            await this.tokenService.postContactingActions(token, ContactMethod.TWITTER, isSuccess)

            await this.driver.sleep(this.messageDelaySec * 1000)
        }
    }

    private async contactWithToken(link: string, message: string): Promise<ContactHistoryStatusType> {
        this.log(`Trying to contact with ${link}`)

        await this.driver.get(link)
        await this.driver.sleep(20000)

        let mainColumn: WebElement

        try {
            mainColumn = await this.driver.findElement(
                By.css(`div[data-testid="primaryColumn"]`)
            )
        } catch (err) {
            if (err instanceof Error && 'NoSuchElementError' === err.name) {
                return ContactHistoryStatusType.ACCOUNT_NOT_EXISTS
            }

            throw err
        }

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
            if (err instanceof Error && 'NoSuchElementError' === err.name) {
                return ContactHistoryStatusType.DM_NOT_ENABLED
            }

            throw err
        }

        await element.click()

        await this.driver.sleep(20000)

        this.log(`Dm opened for ${link}. Sending message...`)

        const dmInputSelector = 'div[data-testid="dmComposerTextInput"]'

        let messageInput: WebElement

        try {
            messageInput = await this.driver.findElement(By.css(dmInputSelector))
        } catch (err) {
            if (err instanceof Error && 'NoSuchElementError' === err.name) {
                this.log(`Can't find dm input field. Dm not enabled or account doesn't have access to ${link}`)

                return ContactHistoryStatusType.DM_NOT_ENABLED
            }

            throw err
        }

        const splittedMessage = message.split('\n')

        for (const part of splittedMessage) {
            await messageInput.sendKeys(part)
            await messageInput.sendKeys(Key.SHIFT, Key.ENTER)
        }

        await this.driver.sleep(5000)

        if (this.isProd()) {
            try {
                messageInput = await this.driver.findElement(By.css(dmInputSelector))
            } catch (err) {
                if (err instanceof Error && 'NoSuchElementError' === err.name) {
                    this.log(`Can't find dm input field after insert message. ${link}`)

                    return ContactHistoryStatusType.DM_NOT_ENABLED
                }

                throw err
            }

            await messageInput.sendKeys(Key.ENTER)

            await this.driver.sleep(5000)

            const pageSrc = await this.driver.getPageSource()

            if (pageSrc.includes('failed to send')) {
                this.log('Failed to send message')

                return ContactHistoryStatusType.DM_NOT_ENABLED
            }

            this.log(`Message sent to ${link}`)
        } else {
            this.log('Environment is not production. Skipping sending message')
        }

        this.sentMessages++

        return ContactHistoryStatusType.SENT_DM
    }

    private async initMessage(): Promise<void> {
        const contentMessage = await this.contactMessageService.getOneContactMessage()

        if (!contentMessage) {
            throw new Error(`No messages stock available`)
        }

        this.message = contentMessage
    }

    private async updateSentMessagesAndTotalAttempt(): Promise<void> {
        this.sentMessages = await this.contactHistoryService.getCountSentTwitterMessagesDaily(this.twitterAccount)
        this.attempts = await this.contactHistoryService.getCountAttemptsTwitterDaily(this.twitterAccount)
    }

    private async isLoggedIn(): Promise<boolean> {
        const title = await this.driver.getTitle()

        return title.toLowerCase().includes('home')
    }

    private async disableAccount(): Promise<void> {
        this.twitterAccount.isDisabled = true
        await this.twitterService.setAccountAsDisabled(this.twitterAccount)
    }

    private removeEmojis(message: string): string {
        const regexEmojis = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
        return message.replace(regexEmojis, '')
    }

    private buildMessage(token: Token): string {
        return this.removeEmojis(this.message.content
            .replace(/XXXCOINXXX/g, token.name)
            .replace(/XXXBLOCKCHAINXXX/g, token.blockchain))
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
