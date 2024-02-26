import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService, BSCScanService, FirewallService } from '../../service'
import { explorerDomains, Blockchain, destroyDriver, sleep } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'
import { By, WebDriver } from 'selenium-webdriver'

@singleton()
export class BSCScanTokensTransactionsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTokensTransactionsFetcher.name
    private webDriver: WebDriver
    private readonly supportedBlockchains = [
        Blockchain.ETH,
        Blockchain.BSC,
        Blockchain.CRO,
        Blockchain.MATIC,
        Blockchain.SOL,
    ]

    private readonly delayBetweenPages = 5 * 1000

    private readonly pagesCounts = {
        [Blockchain.BSC]: 100,
        [Blockchain.ETH]: 50,
        [Blockchain.CRO]: 100,
        [Blockchain.MATIC]: 100,
        [Blockchain.SOL]: 100,
    }

    private readonly isSol90DaysCheck: boolean = true //Only for first time fetch

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

            await destroyDriver(this.webDriver)
        } catch (error) {
            await destroyDriver(this.webDriver)
            throw error
        }

        this.logger.info(`[${this.workerName}] finished`)
    }

    private async runByBlockchain(blockchain: Blockchain): Promise<void> {
        if (Blockchain.SOL === blockchain) {
            return this.runSolanaWorker()
        }

        const pagesCount = this.pagesCounts[blockchain]

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        const explorerDomain = explorerDomains[blockchain]
        await this.initializeBrowser(this.bscscanService.getTokenTxsPageUrl(explorerDomain, pagesCount))

        for (let page = pagesCount; page >= 1; page--) {
            this.logger.info(`Loading page ${page} | Blockchain: ${blockchain}`)

            await this.loadPage(this.bscscanService.getTokenTxsPageUrl(explorerDomain, page))

            await this.webDriver.sleep(this.delayBetweenPages)

            const pageSource = await this.webDriver.getPageSource()

            this.logger.info(`Checking and enqueueing Tokens Addresses`)
            await this.explorerParser.enqueuePageSrcTokenAddresses(pageSource, blockchain)

            this.logger.info(`Checking and enqueueing Wallets Addresses`)
            await this.explorerParser.enqueuePageSrcWalletAddresses(pageSource, blockchain)
        }

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }

    private async runSolanaWorker(): Promise<void> {
        const explorerDomain = explorerDomains[Blockchain.SOL]
        await this.initializeBrowser(`https://${explorerDomain}/leaderboard#account`)

        await sleep(5000)

        if (this.isSol90DaysCheck) {
            const btnSelector = await this.webDriver.findElements(By.className('ant-btn ant-btn-default sc-elvGZv ibqvPY'))
            if (btnSelector.length) {
                await btnSelector[btnSelector.length -1].click()
                await sleep(10000)
            }
        }

        await this.bscscanService.setSolExplorerPageSize(this.webDriver, 'rc_select_2')
        await sleep(10000)

        const tablesSelector = await this.webDriver.findElements(By.css('table'))

        if (tablesSelector.length >= 2) {
            const transactionsTable = tablesSelector[1]
            const tableRows = await transactionsTable.findElements(By.css('tr'))
            let keepFetching = true

            while (keepFetching) {
                this.logger.info(`Searching for tokens and wallets`)

                const walletAddresses = []
                const tokensAddresses = []

                for (const row of tableRows) {
                    const hrefLinksSelector = await row.findElements(By.css('a'))

                    if (hrefLinksSelector.length >= 3) {
                        const tokenAddress = (await hrefLinksSelector[2].getAttribute('href')).split('/').pop()

                        if (tokenAddress) {
                            tokensAddresses.push(tokenAddress)
                        }

                        const walletAddress = (await hrefLinksSelector[0].getAttribute('href')).split('/').pop()

                        if (walletAddress) {
                            walletAddresses.push(walletAddress)
                        }
                    }
                }

                this.logger.info(`Trying to qneueu ${tokensAddresses.length} tokens and ${walletAddresses.length} wallets`)
                await this.explorerParser.enqueueTokenAddresses(tokensAddresses, Blockchain.SOL)
                await this.explorerParser.enqueueWalletAddresses(walletAddresses, Blockchain.SOL)

                const btnsSelector = await this.webDriver.findElements(By.className('ant-btn ant-btn-default sc-bugHcy dSwfoE'))

                if (btnsSelector.length >= 3) {
                    const nextBtn = btnsSelector[2]

                    if (await nextBtn.isEnabled()) {
                        this.logger.info(`Clicking next button`)
                        await nextBtn.click()
                        await sleep(10000)
                    } else {
                        keepFetching = false
                    }
                }
            }
        }
    }

    private async initializeBrowser(url: string): Promise<void> {
        this.webDriver = await SeleniumService.createCloudFlareByPassedDriver(
            url,
            this.firewallService,
            this.logger,
        )
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
