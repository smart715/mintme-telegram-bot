import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, sleep } from '../../../utils'
import { TokensInsightService, TokensService } from '../../service'
import {
    TokensInsightAllCoinsResponse,
    TokensInsightCoinDataResponse,
    TokensInsightPlatform,
} from '../../../types'

@singleton()
export class TokensInsightWorker extends AbstractTokenWorker {
    private readonly workerName = 'TokensInsight'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly limit = 1500

    public constructor(
        private readonly tokensInsightService: TokensInsightService,
        private readonly tokensService: TokensService,
        private readonly logger: Logger,
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
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all coins. Offset: ${offset}. Limit: ${this.limit} Reason: ${ex.message}`
                )

                return
            }

            const coins = allCoinsRes.data.items
            const coinsLength = coins.length
            const platformRegEx = this.getPlatformRegEx(currentBlockchain)

            if (0 === coinsLength) {
                fetchNext = false
            }

            let i = 0

            for (const coin of coins) {
                ++i
                const tokenName = coin.name + '(' + coin.symbol + ')'

                this.logger.info(`${this.prefixLog} Check ${tokenName}. ${i+offset}/${coinsLength+offset}`)

                const tokenInDb = await this.tokensService.findByName(tokenName, currentBlockchain)

                if (tokenInDb) {
                    continue
                }

                let coinData: TokensInsightCoinDataResponse

                try {
                    coinData = await this.tokensInsightService.getCoinData(coin.id)
                } catch (ex: any) {
                    this.logger.error(
                        `${this.prefixLog} Failed to fetch coin data for ${coin.id}  id. Reason: ${ex.message}. Skipping`
                    )

                    continue
                }

                await sleep(1000)

                const tokenAddress = this.getTokenAddress(coinData, platformRegEx)

                if (!tokenAddress) {
                    continue
                }

                const tokenInDbWithSameAddr = await this.tokensService.findByAddress(tokenAddress, currentBlockchain)

                if (tokenInDbWithSameAddr) {
                    continue
                }

                const websites = coinData.data.website

                const links = this.getLinks(coinData)

                if (0 === links.length) {
                    continue
                }

                await this.tokensService.addIfNotExists(
                    tokenAddress,
                    tokenName,
                    websites,
                    [ '' ],
                    links,
                    this.workerName,
                    currentBlockchain
                )

                this.logger.info(
                    `${this.prefixLog} Added to DB:`,
                    [
                        tokenAddress,
                        tokenName,
                        websites,
                        links,
                        this.workerName,
                        currentBlockchain,
                    ]
                )
            }

            offset += this.limit
        } while (fetchNext)
    }

    private getLinks(coinData: TokensInsightCoinDataResponse): string[] {
        const community = coinData.data.community

        return [
            community.twitter,
            community.facebook,
            community.telegram,
            community.reddit,
            community.discord,
            community.linkedin,
            community.instagram,
            community.youtube,
        ].filter((link) => link)
    }

    private getPlatformRegEx(currentBlockchain: Blockchain): RegExp {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return /binance|bsc|bnb/
            case Blockchain.ETH:
                return /eth|ethereum/
            case Blockchain.CRO:
                return /cronos|cro/
            default:
                throw new Error('Wrong blockchain provided. Platform regex doesn\'t exists for provided blockchain')
        }
    }

    private getTokenAddress(coinData: TokensInsightCoinDataResponse, target: RegExp): string|null {
        const platform: TokensInsightPlatform[] = coinData.data.platforms.filter(
            (platform) => target.test(platform.name.toLowerCase())
        )

        if (platform.length > 0 && '' !== platform[0].address) {
            return platform[0].address
        }

        return null
    }
}