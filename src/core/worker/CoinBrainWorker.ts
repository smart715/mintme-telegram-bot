import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from './AbstractTokenWorker'
import { Blockchain, logger } from '../../utils'
import { CoinBrainService } from '../service'
import { CoinBrainGetTokensGeneralResponse, CoinBrainItemTokensGeneralResponse } from '../../types'

@singleton()
export class CoinBrainWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinBrain]'
    private readonly unsupportedBlockchain: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly coinBrainService: CoinBrainService
    ) {
        super()
    }

    public async run(currentBlockchain): Promise<any> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchain.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        let currentChainId: number|null = null

        switch (currentBlockchain) {
            case Blockchain.BSC:
                currentChainId = 56

                break
            case Blockchain.ETH:
                currentChainId = 1

                break
        }

        if (null === currentChainId) {
            logger.error(`${this.prefixLog} current blockchain ${currentBlockchain} doesn't have chainId specified. Pls specify it in code. Aborting.`)

            return
        }

        let endCursor = ''
        let hasNextPage = true
        let page = 1

        do {
            logger.info(`${this.prefixLog} Page: ${page}`)
            page += 1

            let res: CoinBrainGetTokensGeneralResponse

            try {
                res = await this.coinBrainService.getTokens(endCursor)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Page: ${page}. EndCursor: ${endCursor}. Reason: ${ex.message}`
                )

                return
            }



            const coins = res.items

            for (const coin: CoinBrainItemTokensGeneralResponse of coins) {
                const address = coin.address.toLowerCase()

                if (coin.chainId.toString() !== currentChainId.toString()) {
                    continue
                }
                
            }



        } while (hasNextPage)
    }
}
