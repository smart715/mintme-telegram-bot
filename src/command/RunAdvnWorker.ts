import { singleton } from 'tsyringe'
import { CommandInterface, RunAdvnWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain, logger } from '../utils'
import { AdvnWorker } from '../core'

@singleton()
export class RunAdvnWorker implements CommandInterface {
    public readonly command = 'run-advn-worker'
    public readonly description = 'This command runs Advn worker from cli'

    public constructor(
        private readonly advnWorker: AdvnWorker,
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
        logger.info(`Started command ${this.command}`)

        await this.advnWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
