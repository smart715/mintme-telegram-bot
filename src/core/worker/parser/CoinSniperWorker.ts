import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, sleep } from '../../../utils'
import { CoinSniperService, ParserCheckedTokenService, TokensService } from '../../service'
import { DOMWindow, JSDOM } from 'jsdom'
import { Logger } from 'winston'

@singleton()
export class CoinSniperWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinSniper'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    public constructor(
        private readonly coinSniperService: CoinSniperService,
        private readonly tokenService: TokensService,
        private readonly parserCheckedTokenService: ParserCheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started for ${currentBlockchain} blockchain`)

        let page = 1

        while (true) { // eslint-disable-line
            // todo: fix cloudflare
            const pageContentSource = await this.coinSniperService.loadTokens(currentBlockchain, page)
            const pageDOM = (new JSDOM(pageContentSource)).window

            const coinsIds = this.getCoinsIds(pageDOM)

            if (!coinsIds.length) {
                break
            }

            for (const coinId of coinsIds) {
                if (await this.parserCheckedTokenService.isCached(coinId, this.workerName)) {
                    this.logger.warn(`${this.prefixLog} Data for coin ${coinId} already cached. Skipping`)

                    continue
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
                        [
                            tokenAddress,
                            tokenName,
                            website,
                            this.workerName,
                            currentBlockchain,
                        ],
                    )
                } else {
                    this.logger.error(`${this.prefixLog} Unsupported blockchain or wrong data for ${coinId}. Skipping`)
                }

                await this.parserCheckedTokenService.cacheTokenData(coinId, this.workerName)

                await sleep(2000)
            }

            page++
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
