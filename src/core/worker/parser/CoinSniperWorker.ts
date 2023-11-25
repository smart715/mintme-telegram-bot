import { singleton } from 'tsyringe'
import { Blockchain, sleep } from '../../../utils'
import { CheckedTokenService, CoinSniperService, FirewallService, NewestCheckedTokenService, SeleniumService, TokensService } from '../../service'
import { DOMWindow, JSDOM } from 'jsdom'
import { Logger } from 'winston'
import { By, WebDriver, until } from 'selenium-webdriver'
import { NewestTokenChecker, StopCheckException } from './NewestTokenChecker'

@singleton()
export class CoinSniperWorker extends NewestTokenChecker {
    protected readonly workerName = 'CoinSniper'
    protected override readonly sleepTimeBetweenPages = 2 * 1000

    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]
    private readonly sleepBetweenTokens = 4 * 1000
    private webDriver: WebDriver

    public constructor(
        private readonly coinSniperService: CoinSniperService,
        private readonly tokenService: TokensService,
        protected readonly newestTokenCheckedService: NewestCheckedTokenService,
        private readonly firewallService: FirewallService,
        private readonly checkedTokenService: CheckedTokenService,
        protected readonly logger: Logger,
    ) {
        super(
            CoinSniperWorker.name,
            newestTokenCheckedService,
            logger
        )
    }

    public async run(): Promise<void> {
        this.webDriver = await SeleniumService.createCloudFlareByPassedDriver(
            this.coinSniperService.getNewTokensPageUrl(1),
            this.firewallService,
            this.logger,
        )

        for (const blockchain of this.supportedBlockchains) {
            await this.loadPage(this.coinSniperService.getBlockchainFilterPageUrl(blockchain))

            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(blockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started for ${blockchain} blockchain`)

        this.newestChecked = await this.getNewestChecked(blockchain)
        this.needToSaveNextNewestChecked = true
        let page = 1

        try {
            while (true) { // eslint-disable-line
                this.logger.info(`${this.prefixLog} Checking page: ${page}`)

                await this.checkPage(page, blockchain)
                await sleep(this.sleepTimeBetweenPages)

                page += 1
            }
        } catch (error: any) {
            if (error instanceof StopCheckException) {
                this.logger.info(`${this.prefixLog} ${error.message}`)
            } else {
                this.logger.error(`${this.prefixLog} ${error.message}`)

                throw error
            }
        } finally {
            this.logger.info(`${this.prefixLog} Finished`)
        }

        this.logger.info(`${this.prefixLog} worker finished for ${blockchain} blockchain`)
    }

    protected override async checkPage(page: number, blockchain?: Blockchain): Promise<void> {
        await this.loadPage(this.coinSniperService.getNewTokensPageUrl(page))
        await this.webDriver.wait(until.elementLocated(By.className('home')), 60000)

        const pageDOM = (new JSDOM(await this.webDriver.getPageSource())).window
        const coinsIds = this.getCoinsIds(pageDOM)

        if (!coinsIds.length) {
            throw new StopCheckException(`${this.prefixLog} On page ${page} no tokens found. Finishing`)
        }

        for (const coinId of coinsIds) {
            await this.newestCheckedCheck(coinId, blockchain)

            if (await this.checkedTokenService.isChecked(coinId, this.workerName)) {
                this.logger.warn(`${this.prefixLog} ${coinId} already checked. Skipping`)

                continue
            }

            await this.loadPage(this.coinSniperService.getTokenPageUrl(coinId))
            await this.webDriver.wait(until.elementLocated(By.className('home')), 60000)

            const coinPageDocument = (new JSDOM(await this.webDriver.getPageSource())).window.document

            const tokenAddress = (coinPageDocument.getElementsByClassName('contract')[0])
                ? coinPageDocument.getElementsByClassName('contract')[0].getAttribute('data-copy')
                : ''
            const tokenName = coinPageDocument.title.split('-')[0].trim()
            let website = ''
            const linksElements = coinPageDocument.getElementsByClassName('social-icons-desktop')[0].getElementsByTagName('a')
            const links = Array.from(linksElements).map((el) => {
                if ('go' === el.getElementsByTagName('div')[0].innerHTML.toLocaleLowerCase()) {
                    website = el.href
                }

                return el.href
            })

            if (tokenAddress && tokenAddress.startsWith('0x')) {
                await this.tokenService.addOrUpdateToken(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    blockchain!,
                )

                this.logger.info(
                    `${this.prefixLog} Token saved to database:`,
                    [ tokenAddress, tokenName, blockchain ],
                )
            } else {
                this.logger.warn(`${this.prefixLog} Unsupported blockchain or wrong data for ${coinId}. Skipping`)
            }

            await this.checkedTokenService.saveAsChecked(coinId, this.workerName)

            await sleep(this.sleepBetweenTokens)
        }
    }

    private getCoinsIds(dom: DOMWindow): string[] {
        const coinsRows = dom.document
            .getElementsByTagName('table')[dom.document.getElementsByTagName('table').length - 1]
            .querySelectorAll('[data-listingid]')

        return Array.from(coinsRows).map((el) => {
            const link = el.getElementsByTagName('a')[0].href

            return link.split('/')[link.split('/').length - 1]
        })
    }

    private async loadPage(url: string): Promise<void> {
        const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(
            this.webDriver,
            url,
            this.firewallService,
            this.logger
        )

        if (isNewDriver) {
            this.webDriver = newDriver
        }
    }
}
