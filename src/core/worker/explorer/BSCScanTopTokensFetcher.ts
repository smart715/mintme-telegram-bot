import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { explorerDomains, Blockchain, destroyDriver, sleep } from '../../../utils'
import { SeleniumService, BSCScanService, FirewallService } from '../../service'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'
import { By, WebDriver } from 'selenium-webdriver'

@singleton()
export class BSCScanTopTokensFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTopTokensFetcher.name
    private readonly pagesCounts = {
        [Blockchain.BSC]: 9,
        [Blockchain.ETH]: 12,
        [Blockchain.CRO]: 1,
        [Blockchain.MATIC]: 8,
        [Blockchain.SOL]: 10,
    }

    private readonly supportedBlockchains = [
        Blockchain.ETH,
        Blockchain.BSC,
        Blockchain.CRO,
        Blockchain.MATIC,
        Blockchain.SOL,
    ]

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


        if (Blockchain.SOL === blockchain) {
            await this.fetchSolanaTokens()

            await this.loadPage(`https://${explorerDomain}/leaderboard`)
            await this.fetchSolanaTokens()
        } else {
            for (let page = pagesCount; page >= 1; page--) {
                await this.loadPage(this.bscscanService.getTokensPageUrl(explorerDomain, page))

                const pageSource = await this.webDriver.getPageSource()

                await this.explorerParser.enqueuePageSrcTokenAddresses(pageSource, blockchain)
            }
        }

        await destroyDriver(this.webDriver)

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }

    private async fetchSolanaTokens(): Promise<void> {
        await this.bscscanService.setSolExplorerPageSize(this.webDriver, 'rc_select_0')

        await sleep(10000)

        const pagesCount = this.pagesCounts[Blockchain.SOL]

        for (let page = pagesCount; page >= 1; page--) {
            const table = await this.webDriver.findElement(By.css('table'))
            const linksElements = await table.findElements(By.css('a'))

            for (const linkElement of linksElements) {
                const href = await linkElement.getAttribute('href')
                const tokenAddress = href.split('/').pop()

                if (tokenAddress) {
                    await this.explorerParser.enqueuePageSrcTokenAddresses(tokenAddress, Blockchain.SOL)
                }
            }

            const nextBtnSelector = await this.webDriver.findElements(By.className('ant-btn-default'))
            if (nextBtnSelector.length) {
                await nextBtnSelector[nextBtnSelector.length -1].click()
                await sleep(10000)
            }
        }
    }

    private async loadPage(url: string): Promise<void> {
        const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(this.webDriver,
            url,
            this.firewallService,
            this.logger
        )

        if (isNewDriver) {
            this.webDriver = newDriver
        }
    }
}
