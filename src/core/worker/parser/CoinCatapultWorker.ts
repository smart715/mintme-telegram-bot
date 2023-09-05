import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, findContractAddress } from '../../../utils'
import { CoinCatapultService, TokensService } from '../../service'
import { CoinCatapultAllCoinsResponse, CoinCatapultTokenInfoGeneralResponse } from '../../../types'

@singleton()
export class CoinCatapultWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinCatapult'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        protected readonly coinCatapultService: CoinCatapultService,
        protected readonly tokenService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            this.logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        const targetBlockchain = this.getTargetBlockchain(currentBlockchain)

        let allCoinsResponse: CoinCatapultAllCoinsResponse

        try {
            allCoinsResponse = await this.coinCatapultService.getAllCoins()
        } catch (ex: any) {
            this.logger.error(
                `${this.prefixLog} Aborting. Failed to fetch all coins. Reason: ${ex.message}`
            )

            return
        }

        const coins = allCoinsResponse.response
        const count = coins.length

        let i = 0
        for (const coin of coins) {
            ++i

            if (!coin.network || targetBlockchain !== coin.network) {
                continue
            }

            const tokenName = coin.name + '(' + coin.symbol + ')'

            this.logger.info(`${this.prefixLog} Checking ${tokenName} ${i}/${count}`)

            let tokenInfoResponse: CoinCatapultTokenInfoGeneralResponse

            try {
                tokenInfoResponse = await this.coinCatapultService.getTokenInfo(coin.slug)
            } catch (ex: any) {
                this.logger.warn(
                    `${this.prefixLog} Failed to fetch token info for ${tokenName}. Reason: ${ex.message}. Skipping...`
                )

                continue
            }

            const tokenInfo = tokenInfoResponse.response

            const address = 'string' === typeof tokenInfo.contract
                ? findContractAddress(tokenInfo.contract)
                : null

            if (null === address) {
                continue
            }

            const social = tokenInfo.social

            const website = social.website
            const email = social.email || ''

            const links: string[] = []

            if ('string' === typeof social.twitter) {
                links.push(social.twitter)
            }

            if ('string' === typeof social.telegram) {
                links.push(social.telegram)
            }

            const tokenInDb = await this.tokenService.findByAddress(address, currentBlockchain)

            if (tokenInDb) {
                continue
            }

            await this.tokenService.addIfNotExists(
                address,
                tokenName,
                [ website ],
                [ email ],
                links,
                this.workerName,
                currentBlockchain
            )

            this.logger.info(
                `${this.prefixLog} Added to DB:`,
                [
                    address,
                    tokenName,
                    website,
                    links,
                    this.workerName,
                    currentBlockchain,
                ]
            )
        }
    }

    private getTargetBlockchain(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return 'bsc'
            case Blockchain.ETH:
                return 'eth'
            default:
                throw new Error(
                    'Wrong blockchain provided. Target blockchain name doesn\'t exists for provided blockchain'
                )
        }
    }
}