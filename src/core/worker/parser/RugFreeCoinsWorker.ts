import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, findContractAddress, logger } from '../../../utils'
import { RugFreeCoinsService, TokensService } from '../../service'
import { CoinData, RugFreeCoinsAllCoins } from '../../../types'

@singleton()
export class RugFreeCoinsWorker extends AbstractTokenWorker {
    private readonly workerName = 'RugFreeCoins'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly rugFreeCoinsService: RugFreeCoinsService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain: ${currentBlockchain}. Aborting.`)

            return
        }

        let page = 1
        let resultsCount = 0

        do {
            logger.info(`${this.prefixLog} Page: ${page}`)

            let allCoinsRes: RugFreeCoinsAllCoins

            try {
                allCoinsRes = await this.rugFreeCoinsService.getAllCoins(page)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Page: ${page} Reason: ${ex.message}`
                )

                continue
            }

            if ('success' !== allCoinsRes.message) {
                logger.error(`${this.prefixLog} Failed to fetch all coins for page ${page}. Skipping`)

                page += 1
            }

            const allCoins = allCoinsRes.payload.data
            resultsCount = allCoins.length

            for (const coin of allCoins) {
                const tokenAddress = this.getTokenAddress(coin, currentBlockchain)

                if (!tokenAddress) {
                    continue
                }

                const tokenInDb = await this.tokenService.findByAddress(tokenAddress, currentBlockchain)

                if (tokenInDb) {
                    continue
                }

                const tokenName = `${coin.name}(${coin.symbol})`
                const website = coin.website
                const links = this.getLinks(coin)


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
                    website,
                    links,
                    this.workerName,
                    currentBlockchain
                )
            }

            page += 1
        } while(resultsCount > 0)

        logger.info(`${this.prefixLog} Finished`)
    }

    private getLinks(coin: CoinData): string[] {
        const links: string[] = []

        if (coin.twitter_link) {
            links.push(coin.twitter_link)
        }

        if (coin.telegram_link) {
            links.push(coin.telegram_link)
        }

        if (coin.reddit_link) {
            links.push(coin.reddit_link)
        }

        if (coin.discord_link) {
            links.push(coin.discord_link)
        }

        return links
    }

    private getTokenAddress(coin: CoinData, currentBlockchain: Blockchain): string|null {
        let tokenAddress: string|null|undefined = null

        switch (currentBlockchain) {
            case Blockchain.ETH:
                tokenAddress = coin.ethereum_contract_address

                break
            case Blockchain.BSC:
                tokenAddress = coin.bsc_contract_address

                break
            default:
                throw new Error(
                    'Wrong blockchain provided. Token address property doesn\'t exists for provided blockchain'
                )
        }

        if (!tokenAddress) {
            return null
        }

        return findContractAddress(tokenAddress)
    }
}
