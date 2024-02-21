import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { SeleniumService } from '../../service'
import { explorerDomains, Blockchain, destroyDriver } from '../../../utils'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'
import { WebDriver } from 'selenium-webdriver'

@singleton()
export class BSCScanValidatorsFetcher extends AbstractTokenWorker {
    private readonly workerName = BSCScanValidatorsFetcher.name
    private readonly supportedBlockchains = [ Blockchain.BSC ] // Works only for BSC
    private webDriver: WebDriver

    public constructor(
        private readonly explorerParser: ExplorerEnqueuer,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(blockchain: Blockchain|null = null): Promise<void> {
        this.logger.info(`[${this.workerName}] started`)

        try {
            if (blockchain) {
                await this.runByBlockchain(blockchain)
            } else {
                for (const blockchain of this.supportedBlockchains) {
                    await this.runByBlockchain(blockchain)
                }
            }
        } catch (error) {
            await destroyDriver(this.webDriver)
        }

        this.logger.info(`[${this.workerName}] finished`)
    }

    private async runByBlockchain(blockchain: Blockchain): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        this.webDriver = await SeleniumService.createDriver('', undefined, this.logger)

        this.logger.info(`[${this.workerName}] started for ${blockchain} blockchain`)

        await this.webDriver.get('https://' + explorerDomain + '/validators')
        await this.webDriver.sleep(3000)

        const pageSource = await this.webDriver.getPageSource()

        await this.explorerParser.enqueuePageSrcWalletAddresses(pageSource, blockchain)

        this.logger.info(`[${this.workerName}] finished for ${blockchain} blockchain`)

        await destroyDriver(this.webDriver)
    }
}
