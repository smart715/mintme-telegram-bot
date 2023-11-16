import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { explorerDomains, Blockchain, destroyDriver } from '../../../utils'
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

        try {
            if (blockchain) {
                await this.runByBlockchain(blockchain)
            } else {
                for (const blockchain of this.supportedBlockchains) {
                    await this.runByBlockchain(blockchain)
                }
            }
        } catch (error) {
            await destroyDriver(this.webDriver)
            throw error
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
            await this.webDriver.get(this.bscscanService.getTokensPageUrl(explorerDomain, page))
            await this.webDriver.sleep(3000)

            const pageSource = await this.webDriver.getPageSource()

            await this.explorerParser.enqueueTokenAddresses(pageSource, blockchain)
        }

        await destroyDriver(this.webDriver)

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
