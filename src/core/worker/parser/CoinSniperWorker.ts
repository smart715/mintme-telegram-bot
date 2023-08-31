import { singleton } from 'tsyringe'
import { Blockchain, sleep } from '../../../utils'
import { CoinSniperService, FirewallService, NewestCheckedTokenService, SeleniumService, TokensService } from '../../service'
import { DOMWindow, JSDOM } from 'jsdom'
import { Logger } from 'winston'
import { By, WebDriver, until } from 'selenium-webdriver'
import { NewestTokenChecker, StopCheckException } from './NewestTokenChecker'

@singleton()
export class CoinSniperWorker extends NewestTokenChecker {
    protected readonly workerName = 'CoinSniper'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    protected override readonly sleepTimeBetweenPages = 2 * 1000

    private webDriver: WebDriver

    public constructor(
        private readonly coinSniperService: CoinSniperService,
        private readonly tokenService: TokensService,
        protected readonly newestTokenCheckedService: NewestCheckedTokenService,
        private readonly firewallService: FirewallService,
        protected readonly logger: Logger,
    ) {
        super(
            CoinSniperWorker.name,
            newestTokenCheckedService,
            logger
        )
    }

    public async run(): Promise<void> {
        await this.createCloudFlareByPassedDriver()

        for (const blockchain of this.supportedBlockchains) {
            await this.webDriver.get(this.coinSniperService.getBlockchainFilterPageUrl(blockchain))

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
        await this.webDriver.get(this.coinSniperService.getNewTokensPageUrl(page))

        try {
            await this.webDriver.wait(until.elementLocated(By.className('home')), 60000)
        } catch (err) {}

        return
        const pageDOM = (new JSDOM(await this.webDriver.getPageSource())).window

        const coinsIds = this.getCoinsIds(pageDOM)

        if (!coinsIds.length) {
            throw new StopCheckException(`${this.prefixLog} On page ${page} no tokens found. Finishing`)
        }

        for (const coinId of coinsIds) {
            await this.newestCheckedCheck(coinId, blockchain)

            const coinPageSource = await this.coinSniperService.loadToken(coinId)
            const coinPageDocument = (new JSDOM(coinPageSource)).window.document

            const tokenAddress = (coinPageDocument.getElementsByClassName('address')[0])
                ? coinPageDocument.getElementsByClassName('address')[0].innerHTML
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

            if (tokenAddress.startsWith('0x')) {
                await this.tokenService.addIfNotExists(
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

            await sleep(2000)
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

    private async createCloudFlareByPassedDriver(): Promise<void> {
        const {cookies, userAgent} = await this.firewallService.getCloudflareCookies(
            this.coinSniperService.getNewTokensPageUrl(1),
        )

        this.webDriver = await SeleniumService.createDriver('', undefined, this.logger, userAgent)

        if (!cookies) {
            throw new Error('Could not pass cloudflare defence')
        }

        await this.webDriver.get(this.coinSniperService.getNewTokensPageUrl(1))

        console.log(cookies)

        for(const cookie of cookies) {
            await this.webDriver.manage().addCookie({name: cookie.name, value: cookie.value})
        }
    }
}
