import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { ParserWorkersService, TokensService } from '../../service'
import { Blockchain, logger } from '../../../utils'
import config from 'config'
import { DOMWindow, JSDOM } from 'jsdom'

@singleton()
export class CoinLoreWorker extends AbstractTokenWorker {
    private readonly workerName = 'coinlore'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly batchSize: number = config.get('coinlore_request_batch_size')

    public constructor(
        private parserWorkersService: ParserWorkersService,
        private tokensService: TokensService,
    ) {
        super()
    }

    public async run(): Promise<void> {
        let coinsCount = await this.parserWorkersService.getCoinLoreCoinsCount()

        while (coinsCount > 0) {
            const coins = await this.parserWorkersService.loadCoinLoreTokensList(
                coinsCount - this.batchSize,
                this.batchSize
            )

            await this.processTokens(coins)

            coinsCount -= this.batchSize
        }
    }

    public async processTokens(coins: any[]): Promise<any> {
        for (const coin of coins) {
            const pageSource = await this.parserWorkersService.getCoinLoreTokenPage(coin.nameid)
            const pageDOM = (new JSDOM(pageSource)).window

            const tokenAddress = this.parseTokenAddress(pageDOM)
            const links = this.parseLinks(pageDOM)
            const coinBlockchain = this.parseBlockchainFromLinks(links)

            if (!coinBlockchain || !tokenAddress) {
                logger.info(`${this.prefixLog} Wrong blockchain/address for ${coin.name} (${coin.symbol}). Skipping`)

                continue
            }

            await this.tokensService.addIfNotExists(
                tokenAddress,
                `${coin.name} (${coin.symbol})`,
                [ links.shift() || '' ],
                [ '' ],
                links,
                this.workerName,
                coinBlockchain
            )

            logger.info(
                `${this.prefixLog} Token saved to database:`,
                tokenAddress,
                `${coin.name} (${coin.symbol})`,
                this.workerName,
                coinBlockchain
            )
        }
    }

    private parseBlockchainFromLinks(links: string[]): Blockchain | null {
        let blockchain = null

        links.forEach((link) => {
            if (link.includes('bscscan.com')) {
                blockchain = Blockchain.BSC
            } else if (link.includes('etherscan.io')) {
                blockchain = Blockchain.ETH
            }
        })

        return blockchain
    }

    private parseLinks(pageDOM: DOMWindow): string[] {
        return Array.from(pageDOM.document.querySelectorAll('.coin__links_list a'))
            .map((el) => el.getAttribute('href') || '')
            .filter((val) => val)
    }

    private parseTokenAddress(pageDOM: DOMWindow): string {
        return pageDOM.document.querySelector('td.token-address')?.innerHTML || ''
    }
}
