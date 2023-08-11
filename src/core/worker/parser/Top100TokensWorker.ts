import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger } from '../../../utils'
import { TokensService, Top100TokensService } from '../../service'
import { Top100TokensToken, Top100TokensTopListResponse } from '../../../types'

export class Top100TokensWorker extends AbstractTokenWorker {
    private readonly workerName = 'Top100Tokens'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly top100TokensService: Top100TokensService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let page = 1
        let resultsCount = 0

        const targetBlockchain = this.getTargetBlockchain(currentBlockchain)

        do {
            logger.info(`${this.prefixLog} Page: ${page}`)

            let allTokensResponse: Top100TokensTopListResponse

            try {
                allTokensResponse = await this.top100TokensService.getTokens(page)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Page: ${page} Reason: ${ex.message}`
                )

                continue
            }

            if ('success' !== allTokensResponse.status) {
                page += 1

                continue
            }

            const coins = allTokensResponse._data.topList

            resultsCount = coins.length

            for (const coin of coins) {
                if (targetBlockchain !== coin.network) {
                    continue
                }

                const tokenAddress = coin.contract

                if (!tokenAddress) {
                    continue
                }

                const tokenInDb = await this.tokenService.findByAddress(tokenAddress, currentBlockchain)

                if (tokenInDb) {
                    continue
                }
                
                const tokenName = coin.name + '(' + coin.symbol + ')'
                const website = coin.websiteLink
                const links = this.getLinks(coin)

                if (0 === links.length) {
                    continue
                }

                await this.tokenService.add(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    currentBlockchain
                )

                logger.info(
                    `${this.prefixLog} Added to DB:`,
                    tokenAddress,
                    tokenName,
                    [ website ],
                    links,
                    this.workerName,
                    currentBlockchain
                )
            }

            page += 1
        } while (resultsCount > 0)
    }

    private getLinks(coin: Top100TokensToken): string[] {
        const links: string[] = []

        if (coin.reddit !== null && coin.reddit.length > 0) {
            links.push(coin.reddit)
        }

        if (coin.twitter !== null && coin.twitter.length > 0) {
            links.push(coin.twitter)
        }

        if (coin.discord !== null && coin.discord.length > 0) {
            links.push(coin.discord)
        }

        if (coin.telegram !== null && coin.telegram.length > 0) {
            links.push(coin.telegram)
        }

        return links
    }

    private getTargetBlockchain(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.ETH:
                return 'ethereum'
            case Blockchain.BSC:
                return 'binance'
            case Blockchain.CRO:
                return 'cronos'
            default:
                throw new Error('Wrong blockchain provided. Target blockchain doesn\'t exists for provided blockchain')
        }
    }
}
