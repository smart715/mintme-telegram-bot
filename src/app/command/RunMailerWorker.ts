import { Logger } from 'winston'
import { singleton } from 'tsyringe'
import { CommandInterface } from './types'
import { MailerWorker } from '../../core'
import { sleep } from '../../utils'

@singleton()
export class RunMailerWorker implements CommandInterface {
    public readonly command = 'run-mailer-worker'
    public readonly description = 'Runs Mailer worker'

    public constructor(
        private readonly mailerWorker: MailerWorker,
        private readonly logger: Logger,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.mailerWorker.run()

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
