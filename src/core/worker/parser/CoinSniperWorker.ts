import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger, sleep } from '../../../utils'
import { ParserWorkersService, TokenCachedDataService, TokensService } from '../../service'
import { DOMWindow, JSDOM } from 'jsdom'

@singleton()
export class CoinSniperWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinSniper'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly parserWorkersService: ParserWorkersService,
        private readonly tokenService: TokensService,
        private readonly tokenCachedDataService: TokenCachedDataService
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        let page = 1

        // eslint-disable-next-line
        while (true) {
            const pageContentSource = await this.parserWorkersService.loadCoinSniperTokens(currentBlockchain, page)
            const pageDOM = (new JSDOM(pageContentSource)).window

            const coinsIds = this.getCoinsIds(pageDOM)

            if (!coinsIds.length) {
                break
            }

            for (const coinId of coinsIds) {
                if (await this.tokenCachedDataService.isCached(coinId, this.workerName)) {
                    logger.warn(`${this.prefixLog} Data for coin ${coinId} already cached. Skipping`)

                    continue
                }

                const coinPageSource = await this.parserWorkersService.loadCoinSniperToken(coinId)
                const coinPageDocument = (new JSDOM(coinPageSource)).window.document

                const tokenAddress = (coinPageDocument.getElementsByClassName('address')[0])
                    ? coinPageDocument.getElementsByClassName('address')[0].innerHTML
                    : ''
                const tokenName = coinPageDocument.title.split('-')[0].trim()
                let website = ''
                const linksElements = coinPageDocument.getElementsByClassName('social-icons-desktop')[0].getElementsByTagName('a')
                const links = Array.from(linksElements).map((el) => {
                    if ('GO' === el.getElementsByTagName('div')[0].innerText) {
                        website = el.href
                    }

                    return el.href
                })

                if (tokenAddress.startsWith('0x')) {
                    await this.tokenService.add(
                        tokenAddress,
                        tokenName,
                        [ website ],
                        [ '' ],
                        links,
                        this.workerName,
                        currentBlockchain,
                    )

                    logger.info(
                        `${this.prefixLog} Token saved to database:`,
                        tokenAddress,
                        tokenName,
                        website,
                        this.workerName,
                        currentBlockchain
                    )
                } else {
                    logger.error(`${this.prefixLog} Unsupported blockchain or wrong data for ${coinId}. Skipping`)
                }

                await this.tokenCachedDataService.cacheTokenData(coinId, this.workerName, tokenAddress || '')

                await sleep(2000)
            }

            page++
        }

        logger.info(`${this.prefixLog} worker finished`)
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
