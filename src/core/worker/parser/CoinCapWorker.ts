import {AbstractTokenWorker} from '../AbstractTokenWorker'
import {singleton} from 'tsyringe'
import {Blockchain, logger} from '../../../utils'
import {CoinCapService, TokensService} from '../../service'

@singleton()
export class CoinCapWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinCap]'
    private readonly unsupportedBlockchain: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly coinCapService: CoinCapService,
        private readonly tokenService: TokensService
    ) {
        super()
    }
    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchain.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }
    }
}
