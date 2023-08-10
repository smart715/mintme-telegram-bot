import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { explorerDomains, TokenNamesGenerator, Blockchain, logger } from '../../../utils'
import { LastCheckedTokenNameService, SeleniumService } from '../../service'
import { WebDriver } from 'selenium-webdriver'
import { singleton } from 'tsyringe'
import { ExplorerEnqueuer } from './ExplorerEnqueuer'

@singleton()
export class ExplorerSearchAPIWorker extends AbstractTokenWorker {
    private readonly workerName = ExplorerSearchAPIWorker.name

    public constructor(
        private readonly tokenNamesGenerator: TokenNamesGenerator,
        private readonly lastCheckedTokenNameService: LastCheckedTokenNameService,
        private readonly explorerParser: ExplorerEnqueuer,
    ) {
        super()
    }

    public async run(blockchain: Blockchain): Promise<void> {
        const explorerDomain = explorerDomains[blockchain]
        const webDriver = await SeleniumService.createDriver()

        logger.info(`[${this.workerName}] Started for ${blockchain} blockchain`)

        let currentCombination = await this.getLastCheckedCombination(blockchain)

        while (this.tokenNamesGenerator.noFurtherCombinations !== currentCombination) {
            currentCombination = this.tokenNamesGenerator.getNextCombination(currentCombination)

            await this.checkConfiguration(webDriver, explorerDomain, blockchain, currentCombination)
            await this.saveLastCheckedCombination(blockchain, currentCombination)
        }

        await this.saveLastCheckedCombination(blockchain, currentCombination)

        logger.info(`[${this.workerName}] all token name configurations for ${blockchain} blockchain are checked`)
    }

    private async getLastCheckedCombination(blockchain: Blockchain): Promise<string> {
        const lastCheckedTokenName = await this.lastCheckedTokenNameService.getLastCheckedTokenName(
            this.workerName,
            blockchain,
        )

        return lastCheckedTokenName?.tokenName ?? ''
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