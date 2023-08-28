import moment from 'moment'
import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'
import { TwitterAccount } from '../../../entity'
import { TwitterService } from '../../../service'

export class TwitterClient {
    public isInitialized: boolean = false
    public twitterAccount: TwitterAccount
    private sentMessages: number
    private driver: WebDriver

    constructor(
        twitterAccount: TwitterAccount,
        private readonly twitterService: TwitterService,
        private readonly logger: Logger,
    ) {
        this.twitterAccount = twitterAccount
    }

    public async initialize(): Promise<void> {
        const currentDate = moment()
        const limitHitDate = moment(this.twitterAccount.limitHitResetDate)

        if (limitHitDate.isAfter(currentDate)) {
            const diffMs = limitHitDate.diff(currentDate, 'milliseconds')
            const msInDay = 86400000
            this.log(
                `${diffMs / msInDay} days to use this account again, Last limit hit: ${limitHitDate.format()}`
            )
            return
        }

        const isDriverCreated = await this.createDriverWithProxy()

        if (!isDriverCreated) {
            this.logger.warn(`Couldn't initialize driver with proxy`)
            return
        }

        const isLoggedIn = await this.login()
        if (isLoggedIn) {
            await this.updateSentMessages()
            await this.getAccountMessages()
            this.isInitialized = true
            this.log(`
                Logged in | 24h Sent messages: ${this.sentMessages} | Account Messages: ${this.accountMessages.length}`
            )
        }
    }

    private async login(retries: number = 1): Promise<boolean> {
        try {
            this.log(`Logging in, Attempt #${retries}`)

            await this.driver.get('https://twitter.com/')
            await this.driver.sleep(10000)

            const cookies = JSON.parse(this.twitterAccount.cookies)
            Object.keys(localStorage).forEach(async function (key) {
                await driver.executeScript(
                    'document.cookie = `${arguments[0]}=${arguments[1]};path=/`', key, localStorage[key])
            })

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

    private async disableAccount(): Promise<void> {
        this.twitterAccount.isDisabled = true
        await this.twitterService.setAccountAsDisabled(this.twitterAccount)
    }

    public async startContacting(): Promise<void> {

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
