import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger } from '../../../utils'
import { BitQueryService } from '../../service/parser/BitQueryService'
import { QueuedTokenAddressService } from '../../service'

@singleton()
export class BitQueryWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[BitQuery]'

    public constructor(
        private readonly bitQueryService: BitQueryService,
        private readonly queuedTokenAddressService: QueuedTokenAddressService
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let offset = 0
        let fetchNext = true

        const blockchainParam = this.getBlockchainParam(currentBlockchain)
        let currentOffsetRetries = 0

        do {
            logger.info(`${this.prefixLog} Offset: ${offset} | Retries: ${currentOffsetRetries}`)



        } while (fetchNext)
    }

    private getBlockchainParam(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.ETH:
                return 'ethereum'
            case Blockchain.BSC:
                return 'bsc'
            case Blockchain.CRO:
                return 'cronos'
            default:
                throw new Error('Wrong blockchain provided. Blockchain param doesn\'t exists for provided blockchain')
        }
    }
}
