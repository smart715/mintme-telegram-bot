import config from 'config'
import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import {
    ContactHistoryService,
    ContactMessageService,
    ContactQueueService,
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
        private readonly logger: Logger,
    ) {
    }

    public async run(): Promise<void> {
        // eslint-disable-next-line
        while (true) {
            const allAccounts = await this.twitterService.getAllAccounts()

            if (0 === allAccounts.length) {
                this.logger.error(`${this.prefixLog} DB doesn't have twitter accounts. Aborting.`)

                return
            }

            let currentAccountIndex = 0

            while (currentAccountIndex < allAccounts.length && currentAccountIndex < this.maxTwitterAccount) {
                const account = allAccounts[currentAccountIndex]

                const twitterClient = await this.initNewClient(account)

                this.twitterClients.push(twitterClient)

                currentAccountIndex++
            }

            await this.startContactingAllManagers()

            for (const client of this.twitterClients) {
                await client.destroyDriver()
            }

            await sleep(60 * 1000)
        }
    }

    private async initNewClient(twitterAccount: TwitterAccount): Promise<TwitterClient> {
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

        await twitterClient.init()

        return twitterClient
    }

    private startContactingAllManagers(): Promise<void[]> {
        const contactingPromises: Promise<void>[] = []

        for (const client of this.twitterClients) {
            if (!client.isInitialized) {
                this.logger.warn(
                    `[Twitter Worker ID: ${client.twitterAccount.id}] ` +
                    `Not initialized.`
                )

                continue
            }

            if (!client.message) {
                this.logger.warn(
                    `[Twitter Worker ID: ${client.twitterAccount.id}] ` +
                    `No messages stock available, Account not able to start messaging.`
                )

                continue
            }

            if (!client.isAllowedToSentMessages()) {
                this.logger.warn(
                    `[Twitter Worker ID: ${client.twitterAccount.id}] ` +
                    `Client is not allowed to sent messages. Max daily attempts or daily messages reached. Skipping...`
                )

                continue
            }

            contactingPromises.push(client.startContacting())
        }

        return Promise.all(contactingPromises)
    }
}
