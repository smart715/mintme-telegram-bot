import config from 'config'
import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import {
    ContactHistoryService,
    ContactMessageService,
    ContactQueueService, MailerService,
    TokensService,
    TwitterService,
} from '../../../service'
import { TwitterAccount } from '../../../entity'
import { TwitterClient } from './TwitterClient'
import { Environment, sleep } from '../../../../utils'

@singleton()
export class TwitterWorker {
    private readonly workerName = 'TwitterWorker'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly maxTwitterAccount: number = config.get('twitter_max_accounts_simultaneous')

    private twitterClients: TwitterClient[] = []

    public constructor(
        private readonly twitterService: TwitterService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly contactMessageService: ContactMessageService,
        private readonly contactQueueService: ContactQueueService,
        private readonly tokenService: TokensService,
        private readonly environment: Environment,
        private readonly mailerService: MailerService,
        private readonly logger: Logger,
    ) {
    }

    public async run(): Promise<void> {
        // eslint-disable-next-line
        while (true) {
            this.twitterClients = []

            const allAccounts = await this.twitterService.getAllAccounts()

            if (0 === allAccounts.length) {
                await this.mailerService
                    .sendFailedWorkerEmail(`${this.prefixLog} DB doesn't have available twitter accounts.`)

                this.logger.error(`${this.prefixLog} DB doesn't have available twitter accounts. Aborting.`)

                return
            }

            let currentAccountIndex = 0

            while (currentAccountIndex < allAccounts.length && currentAccountIndex < this.maxTwitterAccount) {
                const account = allAccounts[currentAccountIndex]

                const twitterClient = await this.initNewClient(account)

                if (twitterClient) {
                    this.twitterClients.push(twitterClient)
                }

                currentAccountIndex++
            }

            await this.startContactingAllManagers()

            for (const client of this.twitterClients) {
                await client.destroyDriver()
            }

            await sleep(60 * 1000)
        }
    }

    private async initNewClient(twitterAccount: TwitterAccount): Promise<TwitterClient|null> {
        this.logger.info(`${this.prefixLog} Initializing new client for ${twitterAccount.id} twitter id account`)

        const twitterClient = await new TwitterClient(
            twitterAccount,
            this.twitterService,
            this.contactHistoryService,
            this.contactMessageService,
            this.contactQueueService,
            this.tokenService,
            this.environment,
            this.logger,
        )

        const initialized = await twitterClient.init()

        if (!initialized) {
            return null
        }

        return twitterClient
    }

    private startContactingAllManagers(): Promise<void[]> {
        const contactingPromises: Promise<void>[] = []

        for (const client of this.twitterClients) {
            contactingPromises.push(client.startContacting())
        }

        return Promise.all(contactingPromises)
    }
}
