import { container, singleton } from 'tsyringe'
import { CommandInterface, RunTelegramWorkerCmdArgv } from './types'
import { Logger } from 'winston'
import { Database, sleep, TelegramWorkerMode } from '../../utils'
import { MailerService, TelegramWorker } from '../../core'
import { Arguments, Argv } from 'yargs'

@singleton()
export class RunTelegramWorker implements CommandInterface {
    public readonly command = 'run-telegram-worker'
    public readonly description = 'Runs Telegram worker'

    public constructor(
        private readonly telegramWorker: TelegramWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunTelegramWorkerCmdArgv>): void {
        yargs.option('mode', {
            type: 'string',
            describe: 'Default telegram worker type',
            default: () => TelegramWorkerMode.ALL,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunTelegramWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.runTelegramWorker(argv.mode)

        this.logger.info(`Command ${this.command} finished with success`)
    }

    private async runTelegramWorker(workerType: TelegramWorkerMode): Promise<void> {
        try {
            await this.telegramWorker.run(workerType)
        } catch (err: any) {
            if (container.resolve(Database).isFailedConnectionError(err)) {
                await container.resolve(Database).retryConnection()

                await this.runTelegramWorker(workerType)
            }

            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        } finally {
            await sleep(1000)

            process.exit()
        }
    }
}
