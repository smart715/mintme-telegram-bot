import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CoinMarketCapClient } from './CoinmarketcapClient'
import { CMCService, MailerService } from '../../service'
import { sleep } from '../../../utils'
import { CoinMarketCapAccount } from '../../entity'

@singleton()
export class TwitterWorker {
    private readonly workerName = 'CMCCWorker'
    private readonly prefixLog = `[${this.workerName}]`

    private twitterClients: CoinMarketCapClient[] = []
    private maxTwitterAccount: number = 1

    public constructor(
        private readonly cmcService: CMCService,
        private readonly mailerService: MailerService,
        private readonly logger: Logger,
    ) {
    }

    public async run(): Promise<void> {
        // eslint-disable-next-line
        while (true) {
            this.twitterClients = []

            const allAccounts = await this.cmcService.getAllAccounts()

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

            try {
                await this.startAllClients()
            } finally {
                await this.destroyDrivers()
            }


            await sleep(60 * 1000)
        }
    }

    private async initNewClient(cmcAccount: CoinMarketCapAccount): Promise<CoinMarketCapClient|null> {
        this.logger.info(`${this.prefixLog} Initializing new client for ${cmcAccount.id} twitter id account`)

        const cmcClient = await new CoinMarketCapClient(cmcAccount, this.cmcService, this.logger)

        const initialized = await cmcClient.init()

        if (!initialized) {
            return null
        }

        return cmcClient
    }

    private startAllClients(): Promise<void[]> {
        const contactingPromises: Promise<void>[] = []

        for (const client of this.twitterClients) {
            contactingPromises.push(client.startWorker())
        }

        return Promise.all(contactingPromises)
    }

    private async destroyDrivers(): Promise<void> {
        for (const client of this.twitterClients) {
            await client.destroyDriver()
        }
    }
}
