import { singleton } from 'tsyringe'
import { Blockchain, findContractAddress, getHrefFromTagString, getHrefValuesFromTagString, sleep } from '../../../utils'
import { CoinVoteService, CheckedTokenService, TokensService } from '../../service'
import { DOMWindow, JSDOM } from 'jsdom'
import { Logger } from 'winston'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinVoteWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinVote'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [
        Blockchain.ETH,
        Blockchain.BSC,
        Blockchain.MATIC,
        Blockchain.SOL,
    ]

    private readonly maxItemsOnPage = 20

    public constructor(
        private readonly coinVoteService: CoinVoteService,
        private readonly tokenService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
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
            this.logger.info(`${this.prefixLog} Parsing page ${page}`)

            const pageSource = await this.coinVoteService.loadListPage(currentBlockchain, page)
            const pageDOM = (new JSDOM(pageSource)).window

            const coinsIds = this.parseCoinsIds(pageDOM)

            if (!coinsIds) {
                this.logger.warn(`${this.prefixLog} No coins ids found. Stopping fetching pages`)

                break
            }

            for (const coinId of coinsIds) {
                if (await this.checkedTokenService.isChecked(coinId, this.workerName)) {
                    this.logger.warn(`${this.prefixLog} Coin ${coinId} already checked. Skipping`)

                    continue
                }

                const coinPageSource = await this.coinVoteService.loadTokenPage(coinId)
                const coinPageDOM = (new JSDOM(coinPageSource)).window

                const tokenAddress = this.getCoinAddress(coinPageDOM)

                if (tokenAddress) {
                    const tokenName = coinPageDOM.document.title.split(' price today,')[0]
                    const linksEl = coinPageDOM.document.querySelector('.coin-page-row')
                    const website = linksEl ? this.getWebsite(linksEl.innerHTML) : ''
                    const links = linksEl ? this.getLinks(linksEl?.innerHTML) : [ ]

                    await this.tokenService.addOrUpdateToken(
                        tokenAddress,
                        tokenName,
                        [ website ],
                        [ '' ],
                        links,
                        this.workerName,
                        currentBlockchain,
                        this.logger
                    )

                    this.logger.info(
                        `${this.prefixLog} Token saved to database:`,
                        [ tokenAddress, tokenName, currentBlockchain ],
                    )
                } else {
                    this.logger.warn(`${this.prefixLog} Address for coin ${coinId} not found.`)
                }

                await this.checkedTokenService.saveAsChecked(coinId, this.workerName)

                await sleep(2000)
            }

            if (coinsIds.length < this.maxItemsOnPage) {
                this.logger.info(`${this.prefixLog} Coins amount (${coinsIds.length}) less than max. Its last page`)

                break
            }

            page++
        }

        this.logger.info(`${this.prefixLog} worker finished for ${currentBlockchain} blockchain`)
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
