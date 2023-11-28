import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain, findContractAddress } from '../../../utils'
import { CheckedTokenService, RugFreeCoinsService, TokensService } from '../../service'
import { RugFreeCoinData, RugFreeCoinsAllCoins } from '../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class RugFreeCoinsWorker extends AbstractParserWorker {
    private readonly workerName = 'RugFreeCoins'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly rugFreeCoinsService: RugFreeCoinsService,
        private readonly tokenService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        let page = 1
        let resultsCount = 0

        do {
            this.logger.info(`${this.prefixLog} Page: ${page}`)

            let allCoinsRes: RugFreeCoinsAllCoins

            try {
                allCoinsRes = await this.rugFreeCoinsService.getAllCoins(page)
            } catch (ex: any) {
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Page: ${page} Reason: ${ex.message}`
                )

                continue
            }

            if ('success' !== allCoinsRes.message) {
                this.logger.error(`${this.prefixLog} Failed to fetch all coins for page ${page}. Skipping`)

                page += 1
            }

            const allCoins = allCoinsRes.payload.data
            resultsCount = allCoins.length

            for (const coin of allCoins) {
                const currentBlockchain = this.getBlockchain(coin)

                if (!currentBlockchain) {
                    continue
                }

                const tokenAddress = this.getTokenAddress(coin, currentBlockchain)

                if (!tokenAddress) {
                    continue
                }

                if (await this.checkedTokenService.isChecked(tokenAddress, this.workerName)) {
                    this.logger.warn(`${this.prefixLog} ${tokenAddress} already checked. Skipping`)

                    continue
                }


                await this.checkedTokenService.saveAsChecked(tokenAddress, this.workerName)

                const tokenName = `${coin.name}(${coin.symbol})`
                const website = coin.website
                const links = this.getLinks(coin)

                await this.tokenService.addOrUpdateToken(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    currentBlockchain,
                    this.logger
                )

                this.logger.info(
                    `${this.prefixLog} Added to DB:`,
                    [
                        tokenAddress,
                        tokenName,
                        website,
                        links,
                        this.workerName,
                        currentBlockchain,
                    ]
                )
            }

            page += 1
        } while (resultsCount > 0)

        this.logger.info(`${this.prefixLog} finished`)
    }

    private getBlockchain(coin: RugFreeCoinData): Blockchain|null {
        if (coin.ethereum_contract_address) {
            return Blockchain.ETH
        }

        if (coin.bsc_contract_address) {
            return Blockchain.BSC
        }

        return null
    }

    private getLinks(coin: RugFreeCoinData): string[] {
        return [
            coin.twitter_link,
            coin.telegram_link,
            coin.reddit_link,
            coin.discord_link,
        ].filter((link) => link) as string[]
    }

    private getTokenAddress(coin: RugFreeCoinData, currentBlockchain: Blockchain): string|null {
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
