import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { CoinLoreService, ParserCheckedTokenService, TokensService } from '../../service'
import { Blockchain } from '../../../utils'
import config from 'config'
import { DOMWindow, JSDOM } from 'jsdom'
import { Logger } from 'winston'

@singleton()
export class CoinLoreWorker extends AbstractTokenWorker {
    private readonly workerName = 'coinlore'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly batchSize: number = config.get('coinlore_request_batch_size')
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    public constructor(
        private coinLoreService: CoinLoreService,
        private tokensService: TokensService,
        private parserCheckedTokenService: ParserCheckedTokenService,
        private logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        let coinsCount = await this.coinLoreService.getCoinsCount()

        while (coinsCount > 0) {
            const coins = await this.coinLoreService.loadTokensList(
                coinsCount - this.batchSize,
                this.batchSize
            )

            await this.processTokens(coins)

            coinsCount -= this.batchSize
        }
    }

    public async processTokens(coins: any[]): Promise<any> {
        for (const coin of coins) {
            if (await this.parserCheckedTokenService.isCached(coin.nameid, this.workerName)) {
                this.logger.warn(`${coin.nameid} already checked. Skipping`)

                continue
            }

            const pageSource = await this.coinLoreService.getTokenPage(coin.nameid)
            const pageDOM = (new JSDOM(pageSource)).window

            const tokenAddress = this.parseTokenAddress(pageDOM)
            const links = this.parseLinks(pageDOM)
            const coinBlockchain = this.parseBlockchain(pageDOM)

            await this.parserCheckedTokenService.cacheTokenData(coin.nameid, this.workerName)

            if (!coinBlockchain || !this.supportedBlockchains.includes(coinBlockchain) || !tokenAddress) {
                this.logger.warn(
                    `${this.prefixLog} Wrong blockchain/address for ${coin.name} (${coin.symbol})` +
                    `(${coinBlockchain}, ${tokenAddress}). Skipping`
                )

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

            this.logger.info(
                `${this.prefixLog} Token saved to database:`,
                [
                    tokenAddress,
                    `${coin.name} (${coin.symbol})`,
                    this.workerName,
                    coinBlockchain,
                ],
            )
        }
    }

    private parseBlockchain(pageDOM: DOMWindow): Blockchain | null {
        if (pageDOM.document.querySelector('a[title="Binance Coin (BNB)"')) {
            return Blockchain.BSC
        }

        if (pageDOM.document.querySelector('a[title="Ethereum (ETH)"]')) {
            return Blockchain.ETH
        }

        return null
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
