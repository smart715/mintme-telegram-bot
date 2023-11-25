import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { explorerDomains, Blockchain } from '../../../utils'
import { SeleniumService, BSCScanService, FirewallService } from '../../service'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'

@singleton()
export class BSCScanTopTokensFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTopTokensFetcher.name
    private readonly pagesCounts = {
        [Blockchain.BSC]: 9,
        [Blockchain.ETH]: 12,
        [Blockchain.CRO]: 1,
    }

    private readonly supportedBlockchains = [ Blockchain.ETH, Blockchain.BSC, Blockchain.CRO ]
    private webDriver: WebDriver

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

        if (blockchain) {
            await this.runByBlockchain(blockchain)
        } else {
            for (const blockchain of this.supportedBlockchains) {
                await this.runByBlockchain(blockchain)
            }
        }

        this.logger.info(`[${this.workerName}] finished`)
    }

    private async runByBlockchain(blockchain: Blockchain): Promise<void> {
        const pagesCount = this.pagesCounts[blockchain]
        const explorerDomain = explorerDomains[blockchain]
        this.webDriver = await SeleniumService.createCloudFlareByPassedDriver(
            this.bscscanService.getTokensPageUrl(explorerDomain, pagesCount),
            this.firewallService,
            this.logger,
        )

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        for (let page = pagesCount; page >= 1; page--) {
            const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(this.webDriver,
                this.bscscanService.getTokensPageUrl(explorerDomain, page),
                this.firewallService,
                this.logger
                )

            if (isNewDriver) {
                this.webDriver = newDriver
            }

            const pageSource = await this.webDriver.getPageSource()

            await this.explorerParser.enqueueTokenAddresses(pageSource, blockchain)
        }

        if (this.webDriver) {
            await this.webDriver.quit()
        }

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
