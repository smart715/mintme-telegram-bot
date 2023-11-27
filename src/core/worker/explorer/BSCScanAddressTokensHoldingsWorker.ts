import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { By, Key, WebDriver, until } from 'selenium-webdriver'
import { FirewallService, QueuedWalletAddressService, SeleniumService } from '../../service'
import { QueuedWalletAddress } from '../../entity'
import { sleep, Blockchain, explorerDomains } from '../../../utils'
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
    public constructor(
        private readonly queuedWalletAddressService: QueuedWalletAddressService,
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly firewallService: FirewallService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        this.blockchain = blockchain

        const explorerDomain = explorerDomains[blockchain]
        let webDriver

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
                if (!webDriver) { // by pass cloudflare of first wallet page, do it only once
                    webDriver = await SeleniumService.createCloudFlareByPassedDriver(
                        this.buildExplorerUrl(explorerDomain, wallet.walletAddress),
                        this.firewallService,
                        this.logger,
                    )

                    await sleep(this.delayBetweenPages)
                }

                const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(webDriver,
                    this.buildExplorerUrl(explorerDomain, wallet.walletAddress),
                    this.firewallService,
                    this.logger,
                )

                if (isNewDriver) {
                    webDriver = newDriver
                }

                await webDriver.wait(until.elementLocated(By.name('mytable_length')), 60000)

                await webDriver.sleep(this.delayBetweenPages)

                if (await this.isPageAvailable(webDriver)) {
                    const resultsPerPageSelector = await webDriver.findElement(By.name('mytable_length'))

                    for (let i = 0; i < 3; i++) {
                        await resultsPerPageSelector.sendKeys(Key.ARROW_DOWN)
                        await webDriver.sleep(300)
                    }

                    await webDriver.sleep(this.delayBetweenPages)

                    await this.processTokensOnPage(webDriver)

                    const pagesAmount = await this.getPagesAmount(webDriver)

                    for (let page = 2; page <= pagesAmount; page++) {
                        const nextPage = webDriver.findElement(By.id('mytable_next'))
                        await webDriver.executeScript(`arguments[0].click()`, nextPage)

                        await webDriver.sleep(this.delayBetweenPages)

                        await this.processTokensOnPage(webDriver)
                    }
                }

                await this.queuedWalletAddressService.markAsChecked(wallet)

                await sleep(this.delayBetweenPages)
            }
        }
    }

    private buildExplorerUrl(explorerDomain: string, walletAddress: string, page: number = 0): string {
        let url = 'https://' + explorerDomain + '/tokenholdings?ps=100&a=' + walletAddress

        if (0 < page) {
            url += '&p=' + page
        }

        return url
    }

    private async isPageAvailable(webDriver: WebDriver): Promise<boolean> {
        const pageSource = await webDriver.getPageSource()

        return !pageSource.toLowerCase().includes('token holdings page not available for this address')
    }

    private async processTokensOnPage(webDriver: WebDriver): Promise<void> {
        const pageSource = await webDriver.getPageSource()
        await this.explorerParser.enqueueTokenAddresses(pageSource, this.blockchain)
    }

    private async getPagesAmount(webDriver: WebDriver): Promise<number> {
        const pageElements = await webDriver.findElements(By.className('page-link'))

        if (0 === pageElements.length) {
            return 0
        }

        const pagesInfoText = await pageElements[2].getText()

        const pagesAmount = parseInt(pagesInfoText.split('of').slice(-1)[0].trim())

        return isNaN(pagesAmount)
            ? 0
            : pagesAmount
    }
}
