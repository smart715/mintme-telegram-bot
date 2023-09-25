import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService, BSCScanService, FirewallService } from '../../service'
import { explorerDomains, Blockchain } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'

@singleton()
export class BSCScanTokensTransactionsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTokensTransactionsFetcher.name
    private webDriver: WebDriver

    public constructor(
        private readonly bscscanService: BSCScanService,
        private readonly firewallService: FirewallService,
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        this.webDriver = await SeleniumService.createCloudFlareByPassedDriver(
            this.bscscanService.getTokenTxnsPageUrl(explorerDomain, 100),
            this.firewallService,
            this.logger,
        )

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        for (let page = 100; page >= 1; page--) {
            await this.webDriver.get(this.bscscanService.getTokenTxnsPageUrl(explorerDomain, page))
            const pageSource = await this.webDriver.getPageSource()

            await this.explorerParser.enqueueTokenAddresses(pageSource, blockchain)
            await this.explorerParser.enqueueWalletAddresses(pageSource, blockchain)
        }

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
