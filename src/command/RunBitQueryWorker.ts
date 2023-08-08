import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, RunBitQueryWorkerCmdArgv } from './types'
import { Blockchain, logger } from '../utils'
import { BitQueryWorker } from '../core'

@singleton()
export class RunBitQueryWorker implements CommandInterface {
    public readonly command = 'run-bit-query-worker'
    public readonly description = 'This command runs BitQuery worker from cli'

    public constructor(
        private readonly bitQueryWorker: BitQueryWorker,
    ) { }

    public builder(yargs: Argv<RunBitQueryWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunBitQueryWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.bitQueryWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
