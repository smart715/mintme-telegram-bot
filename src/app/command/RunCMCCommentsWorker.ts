import { Logger } from 'winston'
import { CommandInterface } from './types'
import { MailerService, CoinMarketCommentWorker } from '../../core'
import { sleep } from '../../utils'

export class RunCMCCommentsWorker implements CommandInterface {
    public readonly command = 'run-cmc-commenting-worker'
    public readonly description = 'Runs CMC commenting worker'

    public constructor(
        private readonly cmcWorker: CoinMarketCommentWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.cmcWorker.run()
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
