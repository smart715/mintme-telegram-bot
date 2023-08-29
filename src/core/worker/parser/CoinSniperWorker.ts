import { singleton } from 'tsyringe'
import { Blockchain, sleep } from '../../../utils'
import { CoinSniperService, NewestCheckedTokenService, ParserCheckedTokenService, SeleniumService, TokensService } from '../../service'
import { DOMWindow, JSDOM } from 'jsdom'
import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'
import { AbstractTokenWorker } from '../AbstractTokenWorker'

@singleton()
export class CoinSniperWorker extends AbstractTokenWorker {
    protected readonly workerName = 'CoinSniper'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    private webDriver: WebDriver

    public constructor(
        private readonly coinSniperService: CoinSniperService,
        private readonly tokenService: TokensService,
        private readonly parserCheckedTokenService: ParserCheckedTokenService,
        private readonly newestTokenCheckedService: NewestCheckedTokenService,
        protected readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.webDriver = await SeleniumService.createDriver('', undefined, this.logger)

        for (const blockchain of this.supportedBlockchains) {
            await this.webDriver.get(this.coinSniperService.getBlockchainFilterPageUrl(blockchain))

            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started for ${currentBlockchain} blockchain`)

        let page = 1

        const newestChecked = await this.newestTokenCheckedService.findOne(this.workerName, currentBlockchain)

        let firstChecked = null
        let parsingCompleted = false
        while (!parsingCompleted) {
            // todo: fix cloudflare
            await this.webDriver.get(this.coinSniperService.getNewTokensPageUrl(page))
            const pageDOM = (new JSDOM(await this.webDriver.getPageSource())).window

            const coinsIds = this.getCoinsIds(pageDOM)

            if (!coinsIds.length) {
                parsingCompleted = true

                break
            }

            for (const coinId of coinsIds) {
                if (!firstChecked) {
                    firstChecked = coinId
                }

                if (await this.parserCheckedTokenService.isChecked(coinId, this.workerName)) {
                    this.logger.warn(`${this.prefixLog} Coin ${coinId} already checked. Skipping`)

                    continue
                }

                if (newestChecked && newestChecked.tokenId === coinId) {
                    parsingCompleted = true

                    this.logger.warn(`${this.prefixLog} Reached newest checked (${coinId}). Breaking`)

                    break
                }

                const coinPageSource = await this.coinSniperService.loadToken(coinId)
                const coinPageDocument = (new JSDOM(coinPageSource)).window.document

                const tokenAddress = (coinPageDocument.getElementsByClassName('address')[0])
                    ? coinPageDocument.getElementsByClassName('address')[0].innerHTML
                    : ''
                const tokenName = coinPageDocument.title.split('-')[0].trim()
                let website = ''
                const linksElements = coinPageDocument.getElementsByClassName('social-icons-desktop')[0].getElementsByTagName('a')
                const links = Array.from(linksElements).map((el) => {
                    if ('GO' === el.getElementsByTagName('div')[0].innerHTML) {
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
                        currentBlockchain,
                    )

                    this.logger.info(
                        `${this.prefixLog} Token saved to database:`,
                        [ tokenAddress, tokenName, currentBlockchain ],
                    )
                } else {
                    this.logger.error(`${this.prefixLog} Unsupported blockchain or wrong data for ${coinId}. Skipping`)
                }

                await this.parserCheckedTokenService.saveAsChecked(coinId, this.workerName)

                await sleep(2000)
            }

            page++
        }

        if (parsingCompleted && firstChecked) {
            this.newestTokenCheckedService.save(this.workerName, firstChecked, currentBlockchain)

            this.logger.error(`${this.prefixLog} Saved ${firstChecked} as newest checked for ${currentBlockchain}.`)
        }

        this.logger.info(`${this.prefixLog} worker finished for ${currentBlockchain} blockchain`)
    }

    private getCoinsIds(dom: DOMWindow): string[] {
        const coinsRows = dom.document.getElementsByTagName('table')[dom.document.getElementsByTagName('table').length -1]
            .querySelectorAll('[data-listingid]')

        return Array.from(coinsRows).map((el) => {
            const link = el.getElementsByTagName('a')[0].href

            return link.split('/')[link.split('/').length-1]
        })
    }
}
