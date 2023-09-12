import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain, findContractAddress, parseBlockchainName } from '../../../utils'
import { CoinCodexService, TokensService } from '../../service'
import { CoinCodexCoinResponse, CoinInfoResponse } from '../../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinCodexWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinCodex'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    public constructor(
        private readonly coinCodexService: CoinCodexService,
        private readonly tokenService: TokensService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        let i = 0

        let coins: CoinCodexCoinResponse[]

        try {
            coins = await this.coinCodexService.getAllCoins()
        } catch (ex: any) {
            this.logger.error(
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
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch coin info.  Reason: ${ex.message}. Skipping.`
                )

                continue
            }

            let currentBlockchain: Blockchain

            try {
                currentBlockchain = parseBlockchainName(coinInfo.platform)
            } catch (e) {
                continue
            }

            if (!this.supportedBlockchains.includes(currentBlockchain)) {
                continue
            }

            const explorerURI = this.getExplorerURI(currentBlockchain)

            this.logger.info(`${this.prefixLog} Checking token ${coinName} (${i}/${coins.length})`)

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

            this.logger.info(
                `${this.prefixLog} Added to DB:`,
                [
                    contractAddress,
                    coinName,
                    website,
                    links,
                    this.workerName,
                    currentBlockchain,
                ]
            )
        }

        this.logger.info(`${this.prefixLog} Worker finished`)
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
}
