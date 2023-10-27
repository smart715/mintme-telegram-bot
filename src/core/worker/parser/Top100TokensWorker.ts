import { Logger } from 'winston'
import { Blockchain, parseBlockchainName } from '../../../utils'
import { TokensService, Top100TokensService } from '../../service'
import { Top100TokensToken, Top100TokensTopListResponse } from '../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

export class Top100TokensWorker extends AbstractParserWorker {
    private readonly workerName = 'Top100Tokens'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly top100TokensService: Top100TokensService,
        private readonly tokenService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        let page = 1
        let resultsCount = 0

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
                let currentBlockchain: Blockchain

                try {
                    currentBlockchain = parseBlockchainName(coin.network)
                } catch (e) {
                    continue
                }

                const tokenAddress = coin.contract

                if (!tokenAddress) {
                    continue
                }

                const tokenInDb = await this.tokenService.findByAddress(tokenAddress)

                if (tokenInDb) {
                    continue
                }

                const tokenName = this.getTokenName(coin)
                const website = coin.websiteLink
                const links = this.getLinks(coin)

                if (0 === links.length) {
                    continue
                }

                await this.tokenService.addOrUpdateToken(
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
}
