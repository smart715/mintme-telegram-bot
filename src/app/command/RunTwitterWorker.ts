import { Logger } from 'winston'
import { CommandInterface } from './types'
import { MailerService, TwitterWorker } from '../../core'
import { sleep } from '../../utils'

export class RunTwitterWorker implements CommandInterface {
    public readonly command = 'run-twitter-worker'
    public readonly description = 'Runs Twitter worker'

    public constructor(
        private readonly twitterWorker: TwitterWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.twitterWorker.run()
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
