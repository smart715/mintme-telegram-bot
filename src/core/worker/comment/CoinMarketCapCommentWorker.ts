import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CoinMarketCapClient } from './CoinmarketCapClient'
import { CMCService, MailerService } from '../../service'
import { sleep } from '../../../utils'
import { CoinMarketCapAccount } from '../../entity'
import moment from 'moment'

@singleton()
export class CoinMarketCommentWorker {
    private readonly workerName = 'CMCCWorker'
    private readonly prefixLog = `[${this.workerName}]`

    private cmcClients: CoinMarketCapClient[] = []
    private maxCMCAccount: number = 1

    public constructor(
        private readonly cmcService: CMCService,
        private readonly mailerService: MailerService,
        private readonly logger: Logger,
    ) {
    }

    public async run(): Promise<void> {
        // eslint-disable-next-line
        while (true) {
            this.cmcClients = []

            const allAccounts = await this.cmcService.getAllAccounts()

            if (0 === allAccounts.length) {
                await this.mailerService
                    .sendFailedWorkerEmail(`${this.prefixLog} DB doesn't have available cmc accounts.`)

                this.logger.error(`${this.prefixLog} DB doesn't have available cmc accounts. Aborting.`)

                return
            }

            let currentAccountIndex = 0

            while (currentAccountIndex < allAccounts.length && currentAccountIndex < this.maxCMCAccount) {
                const account = allAccounts[currentAccountIndex]

                const lastLogin = moment(account.lastLogin)

                if (lastLogin.isValid() &&
                moment().subtract(10, 'minutes').isBefore(lastLogin)) {
                    this.logger.info(`Skipping account ${account.userName}, logged in within last 10 minutes`)
                    currentAccountIndex++
                    continue
                }

                const cmcClient = await this.initNewClient(account)

                if (cmcClient) {
                    this.cmcClients.push(cmcClient)
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
        this.logger.info(`${this.prefixLog} Initializing new client for ${cmcAccount.id} cmc id account`)

        const cmcClient = await new CoinMarketCapClient(cmcAccount, this, this.cmcService, this.logger)

        const initialized = await cmcClient.init()

        if (!initialized) {
            return null
        }

        return cmcClient
    }

    private startAllClients(): Promise<void[]> {
        const contactingPromises: Promise<void>[] = []

        for (const client of this.cmcClients) {
            contactingPromises.push(client.startWorker())
        }

        return Promise.all(contactingPromises)
    }

    private async destroyDrivers(): Promise<void> {
        for (const client of this.cmcClients) {
            await client.destroyDriver()
        }
    }

    public isProcessingCoin(coinId: string): boolean {
        for (const client of this.cmcClients) {
            if (coinId === client.currentlyProcessingCoin) {
                return true
            }
        }

        return false
    }
}
