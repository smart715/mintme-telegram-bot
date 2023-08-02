import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from './AbstractTokenWorker'
import { Blockchain, logger } from '../../utils'
import { CoinBrainService, SeleniumService, TokensService } from '../service'
import { CoinBrainGetTokensGeneralResponse } from '../../types'

@singleton()
export class CoinBrainWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinBrain]'
    private readonly unsupportedBlockchain: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly coinBrainService: CoinBrainService,
        private readonly tokenService: TokensService
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<any> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchain.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        const currentChainId = this.getCurrentChainId(currentBlockchain)

        if (null === currentChainId) {
            return
        }

        const cryptoPagePrefix = this.getCryptoPagePrefix(currentBlockchain)

        if (null === cryptoPagePrefix) {
            return
        }

        const webDriver = await SeleniumService.createDriver()

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

            hasNextPage = res.hasNextPage
            endCursor = res.endCursor.toString()

            const coins = res.items


            for (const coin of coins) {
                const address = coin.address.toLowerCase()

                if (coin.chainId.toString() !== currentChainId.toString()) {
                    continue
                }

                const coinInDb = await this.tokenService.findByAddress(address, currentBlockchain)

                if (coinInDb) {
                    continue
                }

                await webDriver.get(this.buildTokenPageUrl(cryptoPagePrefix, address))
                // const tokenInfoStr = await webDriver.getPageSource()
            }
        } while (hasNextPage)
    }

    private getCurrentChainId(currentBlockchain: Blockchain): null|number {
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

            return null
        }

        return currentChainId
    }

    private getCryptoPagePrefix(currentBlockchain: Blockchain): string|null {
        let cryptoPagePrefix: string|null = null

        switch (currentBlockchain) {
            case Blockchain.BSC:
                cryptoPagePrefix = 'bnb'

                break
            case Blockchain.ETH:
                cryptoPagePrefix = 'eth'

                break
        }

        if (null === cryptoPagePrefix) {
            logger.error(`${this.prefixLog} current blockchain ${currentBlockchain} doesn't have crypto prefix specified. Pls specify it in code. Aborting.`)

            return null
        }

        return cryptoPagePrefix
    }

    private buildTokenPageUrl(prefix: string, address: string): string {
        return 'https://coinbrain.com/coins/' + prefix + '-' + address
    }
}
