import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { By, WebDriver, until } from 'selenium-webdriver'
import { FirewallService, QueuedWalletAddressService, SeleniumService } from '../../service'
import { Blockchain, sleep, explorerDomains } from '../../../utils'
import { QueuedWalletAddress } from '../../entity'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'

//todo solve cloudflare check and test it
@singleton()
export class EtherScanAddressTokensHoldingsWorker extends AbstractTokenWorker {
    private readonly workerName = EtherScanAddressTokensHoldingsWorker.name
    private readonly blockchain = Blockchain.ETH
    private readonly explorerDomain = explorerDomains[this.blockchain]
    private readonly walletsBatchAmount = 1000
    private readonly sleepDuration = 60 * 1000
    private readonly delayBetweenPages = 5 * 1000

    public constructor(
        private readonly queuedWalletAddressService: QueuedWalletAddressService,
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly firewallService: FirewallService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        let webDriver

        this.logger.info(`[${this.workerName}] started for ${this.blockchain} blockchain`)

        let wallets: QueuedWalletAddress[]

        // eslint-disable-next-line
        while (true) {
            wallets = await this.queuedWalletAddressService.getWalletsToCheck(this.blockchain, this.walletsBatchAmount)

            if (0 === wallets.length) {
                this.logger.info(`[${this.workerName}] No wallets to check on ${this.blockchain} blockchain`)
                await sleep(this.sleepDuration)
            }

            for (const wallet of wallets) {
                if (!webDriver) { // by pass cloudflare of first wallet page, do it only once
                    webDriver = await SeleniumService.createCloudFlareByPassedDriver(
                        this.buildExplorerUrl(wallet.walletAddress),
                        this.firewallService,
                        this.logger,
                    )

                    await sleep(this.delayBetweenPages)
                }

                await webDriver.get(this.buildExplorerUrl(wallet.walletAddress))
                await webDriver.wait(until.elementLocated(By.id('assets-wallet')), 60000)

                if (await this.isPageAvailable(webDriver)) {
                    while (await this.hasEtherscanLogo(webDriver)) {
                        await sleep(this.delayBetweenPages)
                    }

                    await webDriver.executeScript("document.getElementsByName('mytable_length')[0].selectedIndex = 3; document.getElementsByName('mytable_length')[0].dispatchEvent(new CustomEvent('change'));")
                    await sleep(3 * 1000)

                    await this.processTokensOnPage(webDriver)
                    await this.processPages(webDriver)
                }

                await this.queuedWalletAddressService.markAsChecked(wallet)
            }
        }
    }

    private buildExplorerUrl(walletAddress: string): string {
        return 'https://' + this.explorerDomain + '/tokenholdings?ps=100&a=' + walletAddress
    }

    private async isPageAvailable(webDriver: WebDriver): Promise<boolean> {
        const pageSource = await webDriver.getPageSource()

        return !pageSource.toLowerCase().includes('token holdings page not available for this address')
    }

    private async hasEtherscanLogo(webDriver: WebDriver): Promise<boolean> {
        const pageSource = await webDriver.getPageSource()

        return pageSource.toLowerCase().includes('Etherscan Logo')
    }

    private async processTokensOnPage(webDriver: WebDriver): Promise<void> {
        const pageSource = await webDriver.getPageSource()
        await this.explorerParser.enqueueTokenAddresses(pageSource, this.blockchain)
    }

    private async processPages(webDriver: WebDriver): Promise<void> {
        const lastPage = await this.getPagesAmount(webDriver)

        for (let page = 2; page <= lastPage; page++) {
            await webDriver.executeScript('document.getElementsByClassName(\'pagination\')[0].getElementsByClassName(\'page-link\')[3].click();')
            await sleep(5 * 1000)
            await this.processTokensOnPage(webDriver)
        }
    }

    private async getPagesAmount(webDriver: WebDriver): Promise<number> {
        const paginationElements = await webDriver.findElements(By.className('pagination'))

        if (0 === paginationElements.length) {
            return 0
        }

        const pageElement = await paginationElements[0].findElements(By.className('font-weight-medium'))
        const pagesAmount = parseInt(await pageElement[1].getText())

        return isNaN(pagesAmount)
            ? 0
            : pagesAmount
    }
}
