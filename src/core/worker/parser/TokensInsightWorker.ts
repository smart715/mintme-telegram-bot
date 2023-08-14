import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { singleton } from 'tsyringe'
import { Blockchain, logger } from '../../../utils'

@singleton()
export class TokensInsightWorker extends AbstractTokenWorker {
    private readonly workerName = 'TokensInsight'
    private readonly prefixLog = `[${this.workerName}]`

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let page = 1

        logger.info(`${this.prefixLog} Page: ${page}`)

        ++page
    }
}
