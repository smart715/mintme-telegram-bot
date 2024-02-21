import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { By, Key, WebDriver, until } from 'selenium-webdriver'
import { BSCScanService, FirewallService, QueuedWalletAddressService, SeleniumService } from '../../service'
import { QueuedWalletAddress } from '../../entity'
import { sleep, Blockchain, explorerDomains, destroyDriver } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'

@singleton()
export class BSCScanAddressTokensHoldingsWorker extends AbstractTokenWorker {
    private readonly workerName = BSCScanAddressTokensHoldingsWorker.name
    private readonly walletsBatchAmount = 1000
    private readonly sleepDuration = 60 * 1000
    private readonly delayBetweenPages = 5 * 1000

    private blockchain: Blockchain

    private webDriver: WebDriver

    public constructor(
        private readonly queuedWalletAddressService: QueuedWalletAddressService,
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly firewallService: FirewallService,
        private readonly bscService: BSCScanService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        this.blockchain = blockchain

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        let wallets: QueuedWalletAddress[]

        // eslint-disable-next-line
        while (true) {
            wallets = await this.queuedWalletAddressService.getWalletsToCheck(blockchain, this.walletsBatchAmount)

            if (0 === wallets.length) {
                this.logger.info(`[${this.workerName}] No wallets to check on ${blockchain} blockchain`)
                await sleep(this.sleepDuration)

                continue
            }

            for (const wallet of wallets) {
                this.logger.info(`Loading wallet page ${wallet.walletAddress}`)
                if (!this.webDriver) { // by pass cloudflare of first wallet page, do it only once
                    this.logger.info(`Initializing new webdriver`)

                    this.webDriver = await SeleniumService.createCloudFlareByPassedDriver(
                        this.buildExplorerUrl(wallet),
                        this.firewallService,
                        this.logger,
                    )

                    await sleep(this.delayBetweenPages)
                }

                try {
                    await this.queuedWalletAddressService.markAsChecked(wallet)

                    await this.loadPage(this.buildExplorerUrl(wallet))
                    await this.webDriver.sleep(10000)

                    if (Blockchain.SOL === wallet.blockchain) {
                        await this.checkSolWallet()
                    } else {
                        const tokensDiv = await this.webDriver.findElements(By.id('assets-wallet'))

                        if (tokensDiv.length &&
                        (await tokensDiv[0].getText()).includes('No assets found')) {
                            this.logger.warn(`No tokens on wallet ${wallet.walletAddress}`)
                            continue
                        }

                        try {
                            await this.webDriver.wait(until.elementLocated(By.name('mytable_length')), 30000)
                        } catch (error) {
                            this.logger.warn(`Couldn't find assets table on page of wallet ${blockchain}::${wallet}`)
                        }

                        await this.webDriver.sleep(this.delayBetweenPages)

                        if (await this.isPageAvailable()) {
                            const resultsPerPageSelector = await this.webDriver.findElement(By.name('mytable_length'))

                            for (let i = 0; i < 3; i++) {
                                await resultsPerPageSelector.sendKeys(Key.ARROW_DOWN)
                                await this.webDriver.sleep(300)
                            }

                            await this.webDriver.sleep(this.delayBetweenPages)

                            this.logger.info(`Checking and enqueuing tokens`)
                            await this.processTokensOnPage()

                            const pagesAmount = await this.getPagesAmount()

                            for (let page = 2; page <= pagesAmount; page++) {
                                this.logger.info(`Navigating to next Page: ${page}`)

                                const nextPage = this.webDriver.findElement(By.id('mytable_next'))
                                await this.webDriver.executeScript(`arguments[0].click()`, nextPage)

                                await this.webDriver.sleep(this.delayBetweenPages)

                                await this.processTokensOnPage()
                            }
                        }

                        await sleep(this.delayBetweenPages)
                    }
                } catch (error) {
                    await destroyDriver(this.webDriver)
                    throw error
                }
            }
        }
    }

    private buildExplorerUrl(wallet: QueuedWalletAddress, page: number = 0): string {
        const slug = Blockchain.SOL === wallet.blockchain ?
            `account/${wallet.walletAddress}#portfolio`
            : `tokenholdings?ps=100&a=${wallet.walletAddress}`

        let url = `https://${explorerDomains[wallet.blockchain]}/${slug}`

        if (0 < page) {
            url += '&p=' + page
        }

        return url
    }

    private async isPageAvailable(): Promise<boolean> {
        const pageSource = await this.webDriver.getPageSource()

        return !pageSource.toLowerCase().includes('token holdings page not available for this address')
    }

    private async processTokensOnPage(): Promise<void> {
        const pageSource = await this.webDriver.getPageSource()
        await this.explorerParser.enqueuePageSrcTokenAddresses(pageSource, this.blockchain)
    }

    private async getPagesAmount(): Promise<number> {
        const pageElements = await this.webDriver.findElements(By.className('page-link'))

        if (0 === pageElements.length) {
            return 0
        }

        const pagesInfoText = await pageElements[2].getText()

        const pagesAmount = parseInt(pagesInfoText.split('of').slice(-1)[0].trim())

        return isNaN(pagesAmount)
            ? 0
            : pagesAmount
    }

    private async loadPage(url: string): Promise<void> {
        const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(this.webDriver,
            url,
            this.firewallService,
            this.logger,
        )

        if (isNewDriver) {
            this.webDriver = newDriver
        }
    }

    private async checkSolWallet(): Promise<void> {
        const navList = await this.webDriver.findElement(By.className('ant-tabs-nav-list'))

        if (!(await navList.getText()).includes('Portfolio')) {
            this.logger.info(`No Tokens in this wallet`)
            return
        }

        const containersSelector = await this.webDriver.findElements(By.className('ant-tabs-content-holder'))

        const inputsSelector = await containersSelector[0].findElements(By.css('input'))

        if (inputsSelector.length >= 4) {
            await this.bscService.setSolExplorerPageSize(this.webDriver, inputsSelector[3])
        }

        await sleep(10000)
        let keepFetching = true

        while (keepFetching) {
            keepFetching = false

            const tableElements = await containersSelector[1].findElements(By.css('table'))
            let tokensTable

            for (const table of tableElements) {
                const tableInnerText = await table.getText()

                if (tableInnerText.includes('Token Balance') && tableInnerText.includes('Account')) {
                    tokensTable = table
                    break
                }
            }

            if (!tokensTable) {
                this.logger.info(`Couldn't find tokens table`)
                return
            }

            const tokensAddresses = []

            const tableRows = await tokensTable.findElements(By.css('tr'))

            for (const row of tableRows) {
                const hrefLinksSelector = await row.findElements(By.css('a'))

                if (hrefLinksSelector.length >= 2) {
                    const tokenAddress = (await hrefLinksSelector[1].getAttribute('href')).split('/').pop()

                    if (tokenAddress) {
                        tokensAddresses.push(tokenAddress)
                    }
                }
            }

            if (!tokensAddresses.length) {
                break
            }

            await this.explorerParser.enqueueTokenAddresses(tokensAddresses, Blockchain.SOL)

            const btnsSelector = await containersSelector[1].findElements(By.css('button'))

            for (const btn of btnsSelector) {
                const nextBtnClass = await btn.findElements(By.className('anticon-right'))

                if (nextBtnClass.length && await btn.isEnabled()) {
                    await btn.click()
                    await sleep(10000)
                    keepFetching = true
                    break
                }
            }
        }
    }
}
