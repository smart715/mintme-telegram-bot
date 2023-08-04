import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, explorerDomains, findContractAddress, logger } from '../../../utils'
import { CoinCapService, QueuedTokenAddressService } from '../../service'
import { CoinCapCoinInfoResponse } from '../../../types'

@singleton()
export class CoinCapWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinCap]'
    private readonly unsupportedBlockchain: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly coinCapService: CoinCapService,
        private readonly queuedTokenAddressService: QueuedTokenAddressService
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchain.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        let result: number
        let page = 1
        const limit = 2000

        do {
            logger.info(`${this.prefixLog} Page: ${page}. Limit: ${limit}`)

            let coinsInfoResponse: CoinCapCoinInfoResponse

            try {
                coinsInfoResponse = await this.coinCapService.getCoinsInfo(page, limit)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch coins info. Page: ${page}. Limit: ${limit}. Reason: ${ex.message}`
                )

                return
            }

            const coins = coinsInfoResponse.data

            result = coins.length
            page += 1

            const targetExplorer = this.getTargetExplorer(currentBlockchain)

            for (const coin of coins) {
                const explorerLink = coin.explorer

                if (null === explorerLink || !explorerLink.includes(targetExplorer)) {
                    continue
                }

                const tokenAddress = findContractAddress(explorerLink)

                if (!tokenAddress) {
                    continue
                }

                await this.queuedTokenAddressService.push(tokenAddress, currentBlockchain)

                logger.info(
                    `${this.prefixLog} Pushed token address to queue service:`,
                    tokenAddress,
                    'CoinCap',
                    currentBlockchain
                )
            }
        } while (result > 0)

        logger.info(`${this.prefixLog} finished`)
    }

    private getTargetExplorer(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return explorerDomains[Blockchain.BSC]
            case Blockchain.ETH:
                return explorerDomains[Blockchain.ETH]
            default:
                throw new Error('Wrong blockchain provided. Explorer doesn\'t exists for provided blockchain')
        }
    }
}
