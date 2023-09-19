import { singleton } from 'tsyringe'
import { CommandInterface, RunQueueWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain, sleep } from '../../utils'
import { MailerService, QueueWorker } from '../../core'
import { Logger } from 'winston'

@singleton()
export class RunQueueWorker implements CommandInterface {
    public readonly command = 'run-queue-worker'
    public readonly description = 'Runs queue worker'

    public constructor(
        private readonly queueWorker: QueueWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunQueueWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })

        yargs.option('repeat', {
            type: 'number',
            describe: 'Repeat run in N seconds',
            default: () => 0,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunQueueWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.queueWorker.run(argv.blockchain, argv.repeat)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
