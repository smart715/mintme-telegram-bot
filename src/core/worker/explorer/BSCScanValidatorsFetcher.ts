import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService } from '../../service'
import { explorerDomains, Blockchain, logger } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'

@singleton()
export class BSCScanValidatorsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanValidatorsFetcher.name

    public constructor(
        private readonly explorerParser: ExplorerEnqueuer,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        const webDriver = await SeleniumService.createDriver()

        logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        await webDriver.get('https://' + explorerDomain + '/validators')
        const pageSource = await webDriver.getPageSource()

        await this.explorerParser.enqueueWalletAddresses(pageSource, blockchain)

        logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
