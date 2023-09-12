import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain, explorerDomains, findContractAddress } from '../../../utils'
import { CoinCapService, QueuedTokenAddressService } from '../../service'
import { CoinCapCoinInfoResponse } from '../../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinCapWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinCap'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly coinCapService: CoinCapService,
        private readonly queuedTokenAddressService: QueuedTokenAddressService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        let result: number
        let page = 1
        const limit = 2000

        do {
            this.logger.info(`${this.prefixLog} Page: ${page}. Limit: ${limit}`)

            let coinsInfoResponse: CoinCapCoinInfoResponse

            try {
                coinsInfoResponse = await this.coinCapService.getCoinsInfo(page, limit)
            } catch (ex: any) {
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch coins info. Page: ${page}. Limit: ${limit}. Reason: ${ex.message}`
                )

                return
            }

            const coins = coinsInfoResponse.data

            result = coins.length
            page += 1

            for (const coin of coins) {
                const explorerLink = coin.explorer

                if (!explorerLink) {
                    continue
                }

                const currentBlockchain = this.getBlockchainByExplorerUrl(explorerLink)

                if (!currentBlockchain) {
                    continue
                }

                const tokenAddress = findContractAddress(explorerLink)

                if (!tokenAddress) {
                    continue
                }

                await this.queuedTokenAddressService.push(tokenAddress, currentBlockchain)

                this.logger.info(
                    `${this.prefixLog} Pushed token address to queue service:`,
                    [ tokenAddress, this.workerName, currentBlockchain ]
                )
            }
        } while (result > 0)

        this.logger.info(`${this.prefixLog} finished`)
    }

    private getBlockchainByExplorerUrl(link: string): Blockchain|null {
        if (link.includes(explorerDomains[Blockchain.BSC])) {
            return Blockchain.BSC
        }

        if (link.includes(explorerDomains[Blockchain.ETH])) {
            return Blockchain.ETH
        }

        return null
    }
}
