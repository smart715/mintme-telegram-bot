import { container, singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface } from './types'
import { Database, sleep } from '../utils'
import { TelegramWorker } from '../core'

@singleton()
export class RunTelegramWorker implements CommandInterface {
    public readonly command = 'run-telegram-worker'
    public readonly description = 'Runs Telegram worker'

    public constructor(
        private readonly telegramWorker: TelegramWorker,
        private readonly logger: Logger,
    ) { }

    public builder(): void {}

    public async handler(): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.runTelegramWorker()

        this.logger.info(`Command ${this.command} finished with success`)
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
        } finally {
            await sleep(1000)

            process.exit()
        }
    }
}
