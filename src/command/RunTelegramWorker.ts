import { container, singleton } from 'tsyringe'
import { CommandInterface } from './types'
import { Database, logger } from '../utils'
import { TelegramWorker } from '../core'

@singleton()
export class RunTelegramWorker implements CommandInterface {
    public readonly command = 'run-telegram-worker'
    public readonly description = 'Runs Telegram worker'

    public constructor(
        private readonly telegramWorker: TelegramWorker,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.runTelegramWorker()

        logger.info(`Command ${this.command} finished with success`)
    }

    private async runTelegramWorker(): Promise<void> {
        try {
            await this.telegramWorker.run()
        } catch (err: any) {
            if (container.resolve(Database).isFailedConnectionError(err)) {
                await container.resolve(Database).retryConnection()

                await this.runTelegramWorker()
            }

            throw err
        }
    }
}
