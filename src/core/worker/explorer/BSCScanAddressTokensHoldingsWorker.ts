import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { By, WebDriver } from 'selenium-webdriver'
import { QueuedWalletAddressService, SeleniumService } from '../../service'
import { QueuedWalletAddress } from '../../entity'
import { sleep, Blockchain, explorerDomains } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'

//todo solve cloudflare check and test it
@singleton()
export class BSCScanAddressTokensHoldingsWorker extends AbstractTokenWorker {
    private readonly workerName = BSCScanAddressTokensHoldingsWorker.name
    private readonly walletsBatchAmount = 1000
    private readonly sleepDuration = 60 * 1000

    public constructor(
        private readonly queuedWalletAddressService: QueuedWalletAddressService,
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain.BSC | Blockchain.CRO): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        const webDriver = await SeleniumService.createDriver()

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
                await webDriver.get(this.buildExplorerUrl(explorerDomain, wallet.walletAddress))
                //todo pass cloudflare here

                if (await this.isPageAvailable(webDriver)) {
                    await this.processTokensOnPage(webDriver, blockchain)

                    const pagesAmount = await this.getPagesAmount(webDriver)

                    for (let page = 2; page <= pagesAmount; page++) {
                        await webDriver.get(this.buildExplorerUrl(explorerDomain, wallet.walletAddress, page))
                        await this.processTokensOnPage(webDriver, blockchain)
                    }
                }

                await this.queuedWalletAddressService.markAsChecked(wallet)
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

    private async processTokensOnPage(webDriver: WebDriver, blockchain: Blockchain): Promise<void> {
        const pageSource = await webDriver.getPageSource()
        await this.explorerParser.enqueueTokenAddresses(pageSource, blockchain)
    }

    private async getPagesAmount(webDriver: WebDriver): Promise<number> {
        const pageElements = await webDriver.findElements(By.className('page-link'))

        if (0 === pageElements.length) {
            return 0
        }

        const lastPageElementHref = await pageElements[pageElements.length - 1].getAttribute('href')
        const pagesAmount = parseInt(lastPageElementHref.split('&p=').slice(-1, 0)[0])

        return isNaN(pagesAmount)
            ? 0
            : pagesAmount
    }
}
