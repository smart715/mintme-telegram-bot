import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, RunTop100TokensWorkerCmdArgv } from './types'
import { Blockchain, logger } from '../utils'
import { Top100TokensWorker } from '../core'

@singleton()
export class RunTop100TokensWorker implements CommandInterface {
    public readonly command = 'run-top-100-tokens-worker'
    public readonly description = 'This command runs Top 100 Tokens worker from cli'

    public constructor(
        private readonly top100TokensWorker: Top100TokensWorker,
    ) { }

    public builder(yargs: Argv<RunTop100TokensWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunTop100TokensWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.top100TokensWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
