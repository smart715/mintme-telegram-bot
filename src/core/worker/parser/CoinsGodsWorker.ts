import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { ParserWorkersService, TokenCachedDataService, TokensService } from '../../service'
import { Blockchain, logger, parseBlockchainName, sleep } from '../../../utils'
import { DOMWindow, JSDOM } from 'jsdom'

@singleton()
export class CoinsGodsWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinsGods'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    public constructor(
        private readonly parserWorkersService: ParserWorkersService,
        private readonly tokenService: TokensService,
        private readonly tokenCachedDataService: TokenCachedDataService
    ) {
        super()
    }

    public async run(): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        const pageContentSource = await this.parserWorkersService.loadCoinsGodsTokens()
        const pageDOM = (new JSDOM(pageContentSource)).window

        const coinsIds = this.getCoinsIds(pageDOM)

        for (const coinId of coinsIds) {
            if (await this.tokenCachedDataService.isCached(coinId, this.workerName)) {
                logger.warn(`${this.prefixLog} Data for coin ${coinId} already cached. Skipping`)

                continue
            }

            const coinPageSource = await this.parserWorkersService.loadCoinsGodsTokenPage(coinId)
            const coinPageDocument = (new JSDOM(coinPageSource)).window.document

            const tokenAddress = coinPageDocument.getElementById('coin-text-address')?.innerHTML
            const tokenName = coinPageDocument.getElementsByTagName('h3')[0].innerHTML.toString().split(' <small')[0]
                + ' ('
                    + coinPageDocument.getElementsByTagName('h3')[0].getElementsByTagName('small')[0].innerHTML
                + ')'
            const linksElements = coinPageDocument.getElementsByClassName('mt-2 mt-lg-0')[0].getElementsByTagName('a')
            let website = ''
            const links = Array.from(linksElements).map((el) => {
                if (el.innerHTML.includes('Website')) {
                    website = el.href
                }

                return el.href
            })

            let blockchain
            try {
                blockchain = parseBlockchainName(coinPageDocument.getElementsByClassName('mr-3')[0].innerHTML)
            } catch (err) {
                logger.warn(`${this.prefixLog} Unknown blockchain for coin ${coinId}. Skipping`)

                continue
            }

            if (this.supportedBlockchains.includes(blockchain) && tokenAddress?.startsWith('0x')) {
                await this.tokenService.addIfNotExists(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    blockchain,
                )

                logger.info(
                    `${this.prefixLog} Token saved to database:`,
                    tokenAddress,
                    tokenName,
                    website,
                )
            } else {
                logger.warn(
                    `${this.prefixLog} Unsupported blockchain or wrong data ` +
                    `for ${coinId} (${tokenName}, ${blockchain} , ${tokenAddress}). Skipping`
                )
            }

            await this.tokenCachedDataService.cacheTokenData(coinId, this.workerName, tokenAddress || '')

            await sleep(2000)
        }

        logger.info(`${this.prefixLog} worker finished`)
    }

    private getCoinsIds(dom: DOMWindow): string[] {
        const links = dom.document.getElementsByClassName('singlecoinlink')

        return Array.from(links).map((el) => {
            const href = el.getAttribute('data-href')?.split('/') || []

            return href[href?.length - 1]
        })
    }
}
