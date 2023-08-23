import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, findContractAddress, getHrefFromTagString, getHrefValuesFromTagString, logger, sleep } from '../../../utils'
import { ParserWorkersService, TokenCachedDataService, TokensService } from '../../service'
import { DOMWindow, JSDOM } from 'jsdom'

@singleton()
export class CoinVoteWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinVote'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    public constructor(
        private readonly parserWorkersService: ParserWorkersService,
        private readonly tokenService: TokensService,
        private readonly tokenCachedDataService: TokenCachedDataService,
    ) {
        super()
    }

    public async run(): Promise<void> {
        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started for ${currentBlockchain} blockchain`)

        let page = 1

        // eslint-disable-next-line
        while (true) {
            logger.info(`${this.prefixLog} Parsing page ${page}`)

            const pageSource = await this.parserWorkersService.loadCoinVoteListPage(currentBlockchain, page)
            const pageDOM = (new JSDOM(pageSource)).window

            const coinsIds = this.parseCoinsIds(pageDOM)

            if (!coinsIds) {
                logger.warn(`${this.prefixLog} No coins ids found. Stopping fetching pages`)

                break
            }

            await sleep(2000)

            for (const coinId of coinsIds) {
                if (await this.tokenCachedDataService.isCached(coinId, this.workerName)) {
                    logger.warn(`${this.prefixLog} Data for coin ${coinId} already cached. Skipping`)

                    continue
                }

                const coinPageSource = await this.parserWorkersService.loadCoinVoteTokenPage(coinId)
                const coinPageDOM = (new JSDOM(coinPageSource)).window

                const tokenAddress = this.getCoinAddress(coinPageDOM)

                if (tokenAddress) {
                    const tokenName = coinPageDOM.document.title.split(' price today,')[0]
                    const linksEl = coinPageDOM.document.querySelector('.coin-page-row')
                    const website = linksEl ? this.getWebsite(linksEl.innerHTML) : ''
                    const links = linksEl ? this.getLinks(linksEl?.innerHTML) : [ ]

                    await this.tokenService.addIfNotExists(
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
                    logger.warn(`${this.prefixLog} Address for coin ${coinId} not found.`)
                }

                await this.tokenCachedDataService.cacheTokenData(coinId, this.workerName, tokenAddress || '')

                await sleep(2000)
            }

            page++
        }

        logger.info(`${this.prefixLog} worker finished for ${currentBlockchain} blockchain`)
    }

    private parseCoinsIds(dom: DOMWindow): string[] {
        const listItems = dom.document.querySelectorAll('.regular-table .redirect-coin.app-hide')

        return Array.from(listItems).reduce((acc, el) => {
            const href = el.getAttribute('data-href')

            if (href?.match(/en\/coin\/[a-zA-Z0-9-]{1,32}/)) {
                acc.push(href.replace('en/coin/', ''))
            }

            return acc
        }, [] as string[])
    }

    private getCoinAddress(dom: DOMWindow): string | null {
        const coinInfoEl = dom.document.querySelector('.coin-column')

        if (!coinInfoEl) {
            return null
        }

        return findContractAddress(coinInfoEl.innerHTML)
    }

    private getWebsite(tokenInfo: string): string {
        const websiteRawTags = tokenInfo.match(/<a class="btn btn-primary btn-vote"(.+?)Website(.+?)<\/a/)

        if (null === websiteRawTags) {
            return ''
        }

        return getHrefFromTagString(websiteRawTags)
    }

    private getLinks(tokenInfo: string): string[] {
        return getHrefValuesFromTagString([ tokenInfo ])
    }
}
