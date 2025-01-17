import { Blockchain, sleep } from '../../../utils'
import { Logger } from 'winston'
import { NewestCheckedTokenService } from '../../service'
import { AbstractParserWorker } from './AbstractParserWorker'

export abstract class NewestTokenChecker extends AbstractParserWorker {
    protected readonly allPagesAreChecked = 'All Pages are checked'
    protected readonly caughtNewestCheckedToken = 'Caught newest checked token'

    protected newestChecked: string | null
    protected needToSaveNextNewestChecked: boolean

    protected readonly sleepTimeBetweenPages = 10 * 1000

    protected constructor(
        protected readonly workerName: string,
        protected readonly newestCheckedTokenService: NewestCheckedTokenService,
        protected readonly logger: Logger
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`[${this.workerName}] Started`)

        this.newestChecked = await this.getNewestChecked()
        this.needToSaveNextNewestChecked = true
        let page = 1

        try {
            while (true) { // eslint-disable-line
                this.logInfo(`Checking page: ${page}`)
                await this.checkPage(page)

                await sleep(this.sleepTimeBetweenPages)
                page += 1
            }
        } catch (error: any) {
            if (error instanceof StopCheckException) {
                this.logInfo(`${error.message}`)
            } else {
                this.logger.error(`[${this.workerName}] ${error.message}`)

                throw error
            }
        } finally {
            this.logger.info(`[${this.workerName}] Finished`)
        }
    }

    private logInfo(message: string): void {
        this.logger.info(`[${this.workerName}] ${message}`)
    }

    public async getNewestChecked(blockchain: Blockchain|null = null): Promise<string | null> {
        return this.newestCheckedTokenService.getTokenId(this.workerName, blockchain)
    }

    protected abstract checkPage(page: number): Promise<void>

    protected async newestCheckedCheck(tokenId: string, blockchain: Blockchain|null = null): Promise<void> {
        if (this.newestChecked && this.newestChecked === tokenId) {
            throw new StopCheckException(this.caughtNewestCheckedToken)
        }

        if (this.needToSaveNextNewestChecked && tokenId) {
            await this.saveNewestChecked(tokenId, blockchain)
        }
    }

    protected async saveNewestChecked(tokenId: string, blockchain: Blockchain|null = null): Promise<void> {
        await this.newestCheckedTokenService.save(this.workerName, tokenId, blockchain)
        this.needToSaveNextNewestChecked = false
    }
}

export class StopCheckException extends Error {}
