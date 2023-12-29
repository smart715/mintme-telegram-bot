import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService, BSCScanService, FirewallService } from '../../service'
import { explorerDomains, Blockchain, destroyDriver } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'

@singleton()
export class BSCScanTokensTransactionsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTokensTransactionsFetcher.name
    private webDriver: WebDriver
    private readonly supportedBlockchains = [ Blockchain.ETH, Blockchain.BSC, Blockchain.CRO ]
    private readonly delayBetweenPages = 5 * 1000
    private readonly pagesCounts = {
        [Blockchain.BSC]: 100,
        [Blockchain.ETH]: 50,
        [Blockchain.CRO]: 100,
        [Blockchain.MATIC]: 100,
        [Blockchain.SOL]: 100,
    }

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
            this.bscscanService.getTokenTxsPageUrl(explorerDomain, pagesCount),
            this.firewallService,
            this.logger,
        )

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        for (let page = pagesCount; page >= 1; page--) {
            const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(this.webDriver,
                this.bscscanService.getTokenTxsPageUrl(explorerDomain, page),
                this.firewallService,
                this.logger
            )

            await this.webDriver.sleep(this.delayBetweenPages)

            if (isNewDriver) {
                this.webDriver = newDriver
            }

            const pageSource = await this.webDriver.getPageSource()

            await this.explorerParser.enqueueTokenAddresses(pageSource, blockchain)
            await this.explorerParser.enqueueWalletAddresses(pageSource, blockchain)
        }

        await destroyDriver(this.webDriver)

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
