import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { explorerDomains, TokenNamesGenerator, Blockchain, destroyDriver } from '../../../utils'
import { LastCheckedTokenNameService, SeleniumService } from '../../service'
import { WebDriver } from 'selenium-webdriver'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'
import { Logger } from 'winston'

@singleton()
export class ExplorerSearchAPIWorker extends AbstractTokenWorker {
    private readonly workerName = ExplorerSearchAPIWorker.name
    private readonly supportedBlockchains = [ Blockchain.ETH, Blockchain.BSC, Blockchain.CRO ]

    public constructor(
        private readonly tokenNamesGenerator: TokenNamesGenerator,
        private readonly lastCheckedTokenNameService: LastCheckedTokenNameService,
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

        this.logger.info(`[${this.workerName}] Started for ${blockchain} blockchain`)

        let currentCombination = await this.getLastCheckedCombination(blockchain)

        while (this.tokenNamesGenerator.noFurtherCombinations !== currentCombination) {
            currentCombination = this.tokenNamesGenerator.getNextCombination(currentCombination)

            try {
                await this.checkConfiguration(webDriver, explorerDomain, blockchain, currentCombination)
                await this.saveLastCheckedCombination(blockchain, currentCombination)
            } catch (error) {
                await destroyDriver(webDriver)
                throw error
            }
        }

        await this.saveLastCheckedCombination(blockchain, currentCombination)

        if (webDriver) {
            await webDriver.quit()
        }

        this.logger.info(`[${this.workerName}] all token name configurations for ${blockchain} blockchain are checked`)
    }

    private async getLastCheckedCombination(blockchain: Blockchain): Promise<string> {
        const lastCheckedTokenName = await this.lastCheckedTokenNameService.getLastCheckedTokenName(
            this.workerName,
            blockchain,
        )

        return lastCheckedTokenName ?? ''
    }

    private async saveLastCheckedCombination(blockchain: Blockchain, combination: string): Promise<void> {
        await this.lastCheckedTokenNameService.save(this.workerName, blockchain, combination)
    }

    private async checkConfiguration(
        webDriver: WebDriver,
        explorerDomain: string,
        blockchain: Blockchain,
        combination: string
    ): Promise<void> {
        await webDriver.get('https://' + explorerDomain + '/searchHandler?term=' + combination + '&filterby=2')
        const pageSource = await webDriver.getPageSource()

        await this.explorerParser.enqueueTokenAddresses(pageSource, blockchain)
    }
}
