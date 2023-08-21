import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, findContractAddress, logger } from '../../../utils'
import { CoinCodexService, TokensService } from '../../service'
import { CoinCodexCoinResponse, CoinInfoResponse } from '../../../types'

@singleton()
export class CoinCodexWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinCodex'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly coinCodexService: CoinCodexService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        const explorerURI = this.getExplorerURI(currentBlockchain)
        const platformRegExp = this.getPlatformRegEx(currentBlockchain)
        let i = 0

        let coins: CoinCodexCoinResponse[]

        try {
            coins = await this.coinCodexService.getAllCoins()
        } catch (ex: any) {
            logger.error(
                `${this.prefixLog} Aborting. Failed to fetch all coins.  Reason: ${ex.message}`
            )

            return
        }

        for (const coin of coins) {
            ++i
            const tokenId = coin.symbol
            const coinName = coin.name + '(' + coin.symbol + ')'

            let coinInfo: CoinInfoResponse

            try {
                coinInfo = await this.coinCodexService.getCoinInfo(tokenId)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch coin info.  Reason: ${ex.message}. Skipping.`
                )

                continue
            }

            if (!platformRegExp.test(coinInfo.platform.toLowerCase())) {
                continue
            }

            logger.info(`${this.prefixLog} Checking token ${coinName} (${i}/${coins.length})`)

            const website = coinInfo.website

            let contractAddress: string|null = null
            const links: string[] = []

            coinInfo.socials.forEach((social) => {
                if (social.value.toLowerCase().includes(explorerURI)) {
                    contractAddress = findContractAddress(social.value)
                } else {
                    links.push(social.value)
                }
            })

            if (!contractAddress) {
                continue
            }

            const tokenInDb = await this.tokenService.findByAddress(contractAddress, currentBlockchain)

            if (tokenInDb) {
                continue
            }

            await this.tokenService.addIfNotExists(
                contractAddress,
                coinName,
                [ website ],
                [ '' ],
                links,
                this.workerName,
                currentBlockchain
            )

            logger.info(
                `${this.prefixLog} Added to DB:`,
                contractAddress,
                coinName,
                website,
                links,
                this.workerName,
                currentBlockchain
            )
        }
    }

    private getExplorerURI(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return 'bscscan'
            case Blockchain.ETH:
                return 'etherscan'
            default:
                throw new Error('Wrong blockchain provided. Explorer URI doesn\'t exists for provided blockchain')
        }
    }

    private getPlatformRegEx(currentBlockchain: Blockchain): RegExp {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return /binance|bsc|bnb/
            case Blockchain.ETH:
                return /eth|ethereum/
            default:
                throw new Error('Wrong blockchain provided. Platform regex doesn\'t exists for provided blockchain')
        }
    }
}
