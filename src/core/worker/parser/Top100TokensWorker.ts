import { Logger } from 'winston'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain } from '../../../utils'
import { TokensService, Top100TokensService } from '../../service'
import { Top100TokensToken, Top100TokensTopListResponse } from '../../../types'

export class Top100TokensWorker extends AbstractTokenWorker {
    private readonly workerName = 'Top100Tokens'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly top100TokensService: Top100TokensService,
        private readonly tokenService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let page = 1
        let resultsCount = 0

        const targetBlockchain = this.getTargetBlockchain(currentBlockchain)

        do {
            this.logger.info(`${this.prefixLog} Page: ${page}`)

            let allTokensResponse: Top100TokensTopListResponse

            try {
                allTokensResponse = await this.top100TokensService.getTokens(page)
            } catch (ex: any) {
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Page: ${page} Reason: ${ex.message}`
                )

                continue
            }

            if ('success' !== allTokensResponse.status) {
                page += 1

                continue
            }

            const coins = allTokensResponse._data.toplist

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

                const tokenName = this.getTokenName(coin)
                const website = coin.websiteLink
                const links = this.getLinks(coin)

                if (0 === links.length) {
                    continue
                }

                await this.tokenService.addIfNotExists(
                    tokenAddress,
                    tokenName,
                    [ website ],
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
                        [ website ],
                        links,
                        this.workerName,
                        currentBlockchain,
                    ]
                )
            }

            page += 1
        } while (resultsCount > 0)
    }

    private getTokenName(coin: Top100TokensToken): string {
        const tempName = coin.name + '(' + coin.symbol + ')'

        return tempName.length <= 255
            ? tempName
            : coin.symbol
    }

    private getLinks(coin: Top100TokensToken): string[] {
        return [
            coin.reddit,
            coin.twitter,
            coin.discord,
            coin.telegram,
        ].filter((link) => link) as string[]
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
