import { singleton } from 'tsyringe'
import { CommandInterface } from './types'
import { logger } from '../utils'
import { MailerWorker } from '../core'

@singleton()
export class RunMailerWorker implements CommandInterface {
    public readonly command = 'run-mailer-worker'
    public readonly description = 'Runs Mailer worker'

    public constructor(
        private readonly mailerWorker: MailerWorker,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.mailerWorker.run()

        logger.info(`Command ${this.command} finished with success`)
    }
}
