import { TwitterAccount } from '../../../entity'
import moment from "moment/moment";
import {Logger} from "winston";

export class TwitterClient {
    public isInitialized: boolean = false
    public twitterAccount: TwitterAccount
    private sentMessages: number

    constructor(
        twitterAccount: TwitterAccount,
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
