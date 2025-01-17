import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain, explorerDomains, findContractAddress, parseBlockchainName } from '../../../utils'
import { CheckedTokenService, CoinCodexService, TokensService } from '../../service'
import { CoinCodexCoinResponse, CoinInfoResponse } from '../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinCodexWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinCodex'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly coinCodexService: CoinCodexService,
        private readonly tokenService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
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

            if (await this.checkedTokenService.isChecked(tokenId, this.workerName)) {
                this.logger.warn(`${this.prefixLog} ${tokenId} already checked. Skipping`)

                continue
            }

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

            await this.tokenService.addOrUpdateToken(
                contractAddress,
                coinName,
                [ website ],
                [ '' ],
                links,
                this.workerName,
                currentBlockchain,
                this.logger
            )

            await this.checkedTokenService.saveAsChecked(tokenId, this.workerName)

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
        const explorerDomain = explorerDomains[currentBlockchain]

        return explorerDomain.split('.')[0]
    }
}
