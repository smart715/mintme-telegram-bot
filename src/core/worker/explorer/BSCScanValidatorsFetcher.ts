import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService } from '../../service'
import { explorerDomains, Blockchain } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'

@singleton()
export class BSCScanValidatorsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanValidatorsFetcher.name

    public constructor(
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        const webDriver = await SeleniumService.createDriver()

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        await webDriver.get('https://' + explorerDomain + '/validators')
        const pageSource = await webDriver.getPageSource()

        await this.explorerParser.enqueueWalletAddresses(pageSource, blockchain)

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
