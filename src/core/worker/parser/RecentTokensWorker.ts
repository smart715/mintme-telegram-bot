import { AbstractTokenWorker } from '../AbstractTokenWorker'
import {Blockchain, logger} from '../../../utils'
import { RecentTokensService, TokensService } from '../../service'

export class RecentTokensWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinBrain'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly recentTokensService: RecentTokensService,
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
    }
}
