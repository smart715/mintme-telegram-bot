import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface, RunAdvnWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain, sleep } from '../utils'
import { AdvnWorker, MailerService } from '../core'

@singleton()
export class RunAdvnWorker implements CommandInterface {
    public readonly command = 'run-advn-worker'
    public readonly description = 'This command runs Advn worker from cli'

    public constructor(
        private readonly advnWorker: AdvnWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunAdvnWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunAdvnWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.advnWorker.run(argv.blockchain)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
