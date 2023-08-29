// @ts-nocheck
import moment from 'moment'
import config from 'config'
import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'
import { TwitterAccount } from '../../../entity'
import {
    ContactHistoryService,
    ContactMessageService,
    ContactQueueService,
    SeleniumService,
    TwitterService
} from '../../../service'
import {getRandomNumber} from '../../../../utils'
import { ContactMethod} from '../../../types'

export class TwitterClient {
    private readonly maxMessagesDaily: number = config.get('twitter_dm_limit_daily')
    private readonly maxAttemptsDaily: number = config.get('twitter_total_attempts_daily')
    private readonly messageDelaySec: number = config.get('twitter_messages_delay_in_seconds')
    public message: string = ''

    public isInitialized: boolean = false
    public twitterAccount: TwitterAccount
    private sentMessages: number
    private driver: WebDriver

    constructor(
        twitterAccount: TwitterAccount,
        private readonly twitterService: TwitterService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactQueueService: ContactQueueService,
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
        this.log(`
            Logged in | 24h Sent messages: ${this.sentMessages} | Account Messages: ${this.accountMessages.length}`
        )
    }

    private async initMessage(): Promise<void> {
        const contentMessage = await this.contactMessageService.getOneContactMessage()

        if (!contentMessage) {
            return
        }

        this.message = contentMessage.content
    }

    private async updateSentMessages(): Promise<void> {
        this.sentMessages = await this.contactHistoryService.getCountSentTwitterMessagesDaily(this.twitterAccount)
    }

    private async createDriver(): Promise<boolean> {
        this.logger.info(`Creating driver instance`)
        this.driver = await SeleniumService.createDriver('', undefined, this.logger)

        return true
    }

    private async login(retries: number = 1): Promise<boolean> {
        try {
            this.log(`Logging in, Attempt #${retries}`)

            await this.driver.get('https://twitter.com/')
            await this.driver.sleep(10000)

            const cookies: object = JSON.parse(this.twitterAccount.cookiesJSON)

            for (const [key, value] of Object.entries(cookies)) {
                await this.driver.executeScript(
                    'document.cookie = `${arguments[0]}=${arguments[1]};path=/`', key, value
                )
            }

            await this.driver.sleep(10000)
            await this.driver.navigate().refresh()
            await this.driver.sleep(30000)

            if (await this.isLoggedIn()) {
                return true
            } else {
                if (retries < 3) {
                    this.logger.info(`Retrying to login, Attempt #${retries}`)
                    return await this.login(retries + 1)
                } else {
                    this.logger.warn(`Account is banned, Err: USER_DEACTIVATED_BAN`)
                    await this.disableAccount()
                    return false
                }
            }
        } catch (e) {
            this.logger.error(e)
            return false
        }
    }

    private async isLoggedIn(): Promise<boolean> {
        const title = await this.driver.getTitle()

        return title.toLowerCase().includes('home');
    }

    private async disableAccount(): Promise<void> {
        this.twitterAccount.isDisabled = true
        await this.twitterService.setAccountAsDisabled(this.twitterAccount)
    }

    private async postSendingCheck(): Promise<void> {
        if (!this.twitterAccount.isDisabled) {
            await this.driver.sleep(this.messageDelaySec * 1000)
            const contactMethod = await this.startContacting()
            return contactMethod
        }
    }

    public async startContacting(): Promise<void> {
        await this.driver.sleep(getRandomNumber(1, 10) * 1000)

        const queuedContact = await this.contactQueueService.getFirstFromQueue(ContactMethod.TWITTER, this.logger)

        if (!queuedContact) {
            return await this.postSendingCheck()
        }

        const token = await this.tokenService.findByAddress(queuedContact.address, queuedContact.blockchain)

        if (!token) {
            await this.contactQueueService.removeFromQueue(queuedContact.address, queuedContact.blockchain)

            this.log(
                `No token for ${queuedContact.address} :: ${queuedContact.blockchain} . Skipping`
            )

            return this.startContacting()
        }

        ///
    }

    public async destroyDriver(): Promise<void> {
        if (this.driver) {
            await this.driver.quit()
        }
    }

    private log(message: string): void {
        this.logger.info(
            `[Telegram Worker ${this.twitterAccount.id}] ` +
            message
        )
    }
}
