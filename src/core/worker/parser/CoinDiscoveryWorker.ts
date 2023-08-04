import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { TokensService, CoinDiscoveryService } from '../../service'
import { Blockchain, getHrefValuesFromTagString, logger } from '../../../utils'
import { CoinDiscoveryGetTokensResponse } from '../../../types'

@singleton()
export class CoinDiscoveryWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinDiscovery]'
    private readonly unsupportedBlockchain: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly coinDiscoveryService: CoinDiscoveryService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchain.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        let count: number
        let start: number = 0

        do {
            logger.info(`${this.prefixLog} Start position ${start}`)

            let allCoinsRes: CoinDiscoveryGetTokensResponse

            try {
                allCoinsRes = await this.coinDiscoveryService.getTokens(start)
            } catch (ex: any) {
                logger.error(
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
                const blockchain = '1' === coin.chain
                    ? 'bnbTokens'
                    : '2' === coin.chain
                        ? 'etherscanTokens'
                        : ''

                if ('' === blockchain) {
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

                await this.tokenService.add(
                    tokenAddress,
                    name,
                    [ website ],
                    [ '' ],
                    links,
                    'CoinDiscovery',
                    currentBlockchain
                )

                logger.info(
                    `${this.prefixLog} Added to DB:`,
                    tokenAddress,
                    name,
                    website,
                    links,
                    'CoinDiscovery',
                    currentBlockchain
                )
            }

            start += 500
        } while (count > 0)

        logger.info(`${this.prefixLog} finished`)
    }

    private getLinks(tokenInfo: string): string[] {
        const socialMediaRegMatch = tokenInfo.match(/<div class="chain-action d-flex">(.+?)<table class="table (.+?)">/)

        if (null === socialMediaRegMatch) {
            return []
        }

        return getHrefValuesFromTagString(socialMediaRegMatch)
    }
}
