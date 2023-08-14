import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { singleton } from 'tsyringe'
import { Blockchain, logger } from '../../../utils'
import { TokensInsightService, TokensService } from '../../service'
import {TokensInsightAllCoinsResponse, TokensInsightCoinDataResponse} from '../../../types/TokensInsight'

@singleton()
export class TokensInsightWorker extends AbstractTokenWorker {
    private readonly workerName = 'TokensInsight'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly limit = 1500

    public constructor(
        private readonly tokensInsightService: TokensInsightService,
        private readonly tokensService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let offset = 0
        let fetchNext = true

        do {
            let allCoinsRes: TokensInsightAllCoinsResponse

            try {
                allCoinsRes = await this.tokensInsightService.getAllCoins(offset, this.limit)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all coins. Offset: ${offset}. Limit: ${this.limit} Reason: ${ex.message}`
                )

                continue
            }

            const coins = allCoinsRes.data.items
            const coinsLength = coins.length

            if (0 === coinsLength) {
                fetchNext = false
            }

            const target = this.getTargetBlockchain(currentBlockchain)

            let i = 0
            for (const coin of coins) {
                ++i
                const tokenName = coin.name + '(' + coin.symbol + ')'

                logger.info(`${this.prefixLog} Check ${tokenName}. ${i}/${coinsLength}`)

                const tokenInDb = await this.tokensService.findByName(tokenName, currentBlockchain)

                if (tokenInDb) {
                    continue
                }

                const coinData = await this.tokensInsightService.getCoinData(coin.id)

                const tokenAddress = this.getTokenAddress(coinData, currentBlockchain)

                if (!tokenAddress) {
                    continue
                }
            }

            offset += this.limit
        } while (fetchNext)
    }

    private getTargetBlockchain(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.ETH:
                return 'ethereum'
            case Blockchain.BSC:
                return 'BNB'
            case Blockchain.CRO:
                return 'cronos'
            default:
                throw new Error('Wrong blockchain provided. Target blockchain doesn\'t exists for provided blockchain')
        }
    }

    public getTokenAddress(coinData: TokensInsightCoinDataResponse, currentBlockchain: Blockchain): Promise|null {
        const platform: Platform = coinData.data.platforms.filter(
            (platform) => platform.name
        )
    }
}
