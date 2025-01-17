import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService, BSCScanService, FirewallService } from '../../service'
import { explorerDomains, Blockchain, destroyDriver } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'

@singleton()
export class BSCScanTopAccountsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTopAccountsFetcher.name
    private webDriver: WebDriver
    private readonly supportedBlockchains = [
        Blockchain.ETH,
        Blockchain.BSC,
        Blockchain.CRO,
        Blockchain.MATIC,
    ]

    public constructor(
        private readonly bscscanService: BSCScanService,
        private readonly firewallService: FirewallService,
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain|null = null): Promise<void> {
        this.logger.info(`[${this.workerName}] started`)

        try {
            if (blockchain) {
                await this.runByBlockchain(blockchain)
            } else {
                for (const blockchain of this.supportedBlockchains) {
                    await this.runByBlockchain(blockchain)
                }
            }
        } finally {
            await destroyDriver(this.webDriver)
        }

        this.logger.info(`[${this.workerName}] finished`)
    }

    private async runByBlockchain(blockchain: Blockchain): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        this.webDriver = await SeleniumService.createCloudFlareByPassedDriver(
            this.bscscanService.getAccountsPageUrl(explorerDomain, 1),
            this.firewallService,
            this.logger,
        )

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        for (let page = 1; page <= 100; page++) {
            const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(this.webDriver,
                this.bscscanService.getAccountsPageUrl(explorerDomain, page),
                this.firewallService,
                this.logger
            )

            if (isNewDriver) {
                this.webDriver = newDriver
            }

            const pageSource = await this.webDriver.getPageSource()

            await this.explorerParser.enqueuePageSrcWalletAddresses(pageSource, blockchain)
        }

        await destroyDriver(this.webDriver)

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
