import config from 'config'
import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { TwitterService } from '../../../service'
import { TwitterAccount } from '../../../entity'
import { TwitterClient } from './TwitterClient'
import { sleep } from '../../../../utils'

@singleton()
export class TwitterWorker {
    private readonly maxTwitterAccount: number = config.get('twitter_max_accounts_simultaneous')

    private twitterClients: TwitterClient[] = []

    public constructor(
        private readonly twitterService: TwitterService,
        private readonly logger: Logger,
    ) {
    }

    public async run(): Promise<void> {
        const allAccounts = await this.twitterService.getAllAccounts()

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

        await sleep(60000)
        const restart = await this.run()
        return restart
    }

    private async initNewClient(twitterAccount: TwitterAccount): Promise<TwitterClient> {
        // init new twitter client
        const twitterClient = new TwitterClient(
            twitterAccount
        )

        await twitterClient.initialize()

        return twitterClient
    }

    private startContactingAllManagers(): Promise<void[]> {
        // start contacting all managers
        const contactingPromises: Promise<void>[] = []

        for (const client of this.twitterClients) {
            if (!client.isInitialized) {
                this.logger.warn(
                    `[Twitter Worker ID: ${client.twitterAccount.id}] ` +
                    `Not initialized.`
                )

                continue
            }

            if (!client.accountMessages?.length) {
                this.logger.warn(
                    `[Twitter Worker ID: ${client.telegramAccount.id}] ` +
                    `No messages stock available, Account not able to start messaging.`
                )

                continue
            }

            contactingPromises.push(client.startContacting())
        }

        return Promise.all(contactingPromises)
    }
}
