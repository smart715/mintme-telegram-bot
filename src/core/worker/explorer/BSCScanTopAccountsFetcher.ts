import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService } from '../../service'
import { explorerDomains, Blockchain, logger } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'

@singleton()
export class BSCScanTopAccountsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTopAccountsFetcher.name

    public constructor(
        private readonly explorerParser: ExplorerEnqueuer,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        const webDriver = await SeleniumService.createDriver()

        logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        for (let page = 1; page <= 100; page++) {
            await webDriver.get('https://' + explorerDomain + '/accounts/' + page + '?ps=100')
            const pageSource = await webDriver.getPageSource()

            await this.explorerParser.enqueueWalletAddresses(pageSource, blockchain)
        }

        logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
