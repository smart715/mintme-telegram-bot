import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CoinDiscoveryService, TokensService } from '../../service'
import { Blockchain, getHrefValuesFromTagString } from '../../../utils'
import { CoinDiscoveryGetTokensResponse } from '../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinDiscoveryWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinDiscovery'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly coinDiscoveryService: CoinDiscoveryService,
        private readonly tokenService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        let count: number
        let start: number = 0

        do {
            this.logger.info(`${this.prefixLog} Start position ${start}`)

            let allCoinsRes: CoinDiscoveryGetTokensResponse

            try {
                allCoinsRes = await this.coinDiscoveryService.getTokens(start)
            } catch (ex: any) {
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Start: ${start} Reason: ${ex.message}`
                )

                return
            }

            const coins = allCoinsRes.data

            count = Object.keys(coins).length

            for (const coin of coins) {
                const name = coin.name + '(' + coin.symbol + ')'
                const nameSlug = coin.name_slug
                const tokenAddress = coin.contract
                const currentBlockchain = this.getBlockchain(coin.chain.toString())

                if (null === currentBlockchain) {
                    continue
                }

                const tokenInDb = await this.tokenService.findByAddress(tokenAddress, currentBlockchain)

                if (!tokenAddress.startsWith('0x') || tokenInDb) {
                    continue
                }

                const tokenInfo = await this.coinDiscoveryService.getInfo(nameSlug)

                const links = this.getLinks(tokenInfo)

                let website = ''

                if (links.length > 0 && tokenInfo.includes('class="link"')) {
                    website = links[0]
                }

                await this.tokenService.addIfNotExists(
                    tokenAddress,
                    name,
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
                        name,
                        website,
                        links,
                        this.workerName,
                        currentBlockchain,
                    ]
                )
            }

            start += 500
        } while (count > 0)

        this.logger.info(`${this.prefixLog} finished`)
    }

    private getBlockchain(chain: string): Blockchain|null {
        switch (chain) {
            case '1':
                return Blockchain.BSC
            case '2':
                return Blockchain.ETH
            default:
                return null
        }
    }

    private getLinks(tokenInfo: string): string[] {
        const socialMediaRegMatch = tokenInfo.match(/<div class="chain-action d-flex">(.+?)<table class="table (.+?)">/)

        if (null === socialMediaRegMatch) {
            return []
        }

        return getHrefValuesFromTagString(socialMediaRegMatch)
    }
}
