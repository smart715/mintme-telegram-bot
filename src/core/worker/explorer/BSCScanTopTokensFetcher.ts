import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { explorerDomains, Blockchain } from '../../../utils'
import { SeleniumService } from '../../service'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'

@singleton()
export class BSCScanTopTokensFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTopTokensFetcher.name
    private readonly pagesCounts = {
        [Blockchain.BSC]: 9,
        [Blockchain.ETH]: 12,
        [Blockchain.CRO]: 1,
    }

    public constructor(
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        const pagesCount = this.pagesCounts[blockchain]
        const explorerDomain = explorerDomains[blockchain]
        const webDriver = await SeleniumService.createDriver()

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        for (let page = pagesCount; page >= 1; page--) {
            await webDriver.get('https://' + explorerDomain + '/tokens?ps=100&p=' + page)
            const pageSource = await webDriver.getPageSource()

            await this.explorerParser.enqueueTokenAddresses(pageSource, blockchain)
        }

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
