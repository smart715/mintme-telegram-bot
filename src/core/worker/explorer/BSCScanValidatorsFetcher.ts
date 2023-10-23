import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService } from '../../service'
import { explorerDomains, Blockchain } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'

@singleton()
export class BSCScanValidatorsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanValidatorsFetcher.name
    private readonly supportedBlockchains = [ Blockchain.BSC ] // Works only for BSC

    public constructor(
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain|null = null): Promise<void> {
        this.logger.info(`[${this.workerName}] started`)

        if (blockchain) {
            await this.runByBlockchain(blockchain)
        } else {
            for (const blockchain of this.supportedBlockchains) {
                await this.runByBlockchain(blockchain)
            }
        }

        this.logger.info(`[${this.workerName}] finished`)
    }

    private async runByBlockchain(blockchain: Blockchain): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        const webDriver = await SeleniumService.createDriver('', undefined, this.logger)

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        await webDriver.get('https://' + explorerDomain + '/validators')
        const pageSource = await webDriver.getPageSource()

        await this.explorerParser.enqueueWalletAddresses(pageSource, blockchain)

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)

        if (webDriver) {
            await webDriver.quit()
        }
    }
}
