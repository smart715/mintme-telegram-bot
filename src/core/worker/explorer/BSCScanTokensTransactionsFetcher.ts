import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService } from '../../service'
import { explorerDomains, Blockchain } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'

@singleton()
export class BSCScanTokensTransactionsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanTokensTransactionsFetcher.name

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

        for (let page = 100; page >= 1; page--) {
            await webDriver.get('https://' + explorerDomain + '/tokentxns?ps=100&p=' + page)
            const pageSource = await webDriver.getPageSource()

            await this.explorerParser.enqueueTokenAddresses(pageSource, blockchain)
            await this.explorerParser.enqueueWalletAddresses(pageSource, blockchain)
        }

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)
    }
}
