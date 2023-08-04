import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain } from '../../../utils'
import { CoinCatapultService, TokensService } from '../../service'

@singleton()
export class CoinCatapultWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinCatapult]'
    private readonly unsupportedBlockchain: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        protected readonly coinCatapultService: CoinCatapultService,
        protected readonly tokenService: TokensService
    ) {
        super();
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {

    }
}
