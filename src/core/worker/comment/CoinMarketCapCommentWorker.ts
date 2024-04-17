import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CoinMarketCapClient } from './CoinmarketCapClient'
import { CMCService, MailerService } from '../../service'
import { sleep } from '../../../utils'
import { CoinMarketCapAccount } from '../../entity'
import moment from 'moment'
import { WorkerInterface } from '../WorkerInterface'
import config from 'config'
import { CMCWorkerConfig } from '../../types'

@singleton()
export class CoinMarketCommentWorker implements WorkerInterface {
    private readonly workerName = 'CMCCWorker'
    private readonly prefixLog = `[${this.workerName}]`

    private cmcClients: CoinMarketCapClient[] = []
    private maxCMCAccount: number = config.get<CMCWorkerConfig>('cmcWorker').maxSimultaneousAccounts

    public constructor(
        private readonly cmcService: CMCService,
        private readonly mailerService: MailerService,
        private readonly logger: Logger,
    ) {
    }

    public async run(): Promise<void> {
        let currentAccountIndex = 0

        // eslint-disable-next-line
        while (true) {
            this.cmcClients = []

            const allAccounts = await this.cmcService.findAllEnabledAccounts()

            if (0 === allAccounts.length) {
                await this.mailerService
                    .sendFailedWorkerEmail(`${this.prefixLog} DB doesn't have available cmc accounts.`)

                this.logger.error(`${this.prefixLog} DB doesn't have available cmc accounts. Aborting.`)

                return
            }


            while (currentAccountIndex < allAccounts.length && this.cmcClients.length < this.maxCMCAccount) {
                const account = allAccounts[currentAccountIndex]

                const lastLogin = moment(account.lastLogin)

                if (lastLogin.isValid() &&
                moment().subtract(15, 'minutes').isBefore(lastLogin)) {
                    this.logger.info(`Skipping account ${account.userName}, logged in within last 15 minutes`)
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

            if (currentAccountIndex >= allAccounts.length - 1) {
                currentAccountIndex = 0
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

    public async startAllClients(): Promise<void[]> {
        const contactingPromises: Promise<void>[] = []

        for (const client of this.cmcClients) {
            contactingPromises.push(client.startWorker())
        }

        return Promise.all(contactingPromises)
    }

    public async destroyDrivers(): Promise<void> {
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
