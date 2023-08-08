import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger } from '../../../utils'

export class RugFreeCoins extends AbstractTokenWorker {
    private readonly workerName = 'RugFreeCoins'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor() {
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

            const allCoinsStr = await this.rugFreeCoinsService.getAllCoins(page)
        } while(resultsCount > 0)
    }
}
