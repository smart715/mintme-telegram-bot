import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, RunNoArgsWorkerCmdArgv } from './types'
import { Blockchain, logger } from '../utils'
import { CoinVoteWorker } from '../core/worker/parser/CoinVoteWorker'

@singleton()
export class RunCoinVoteWorker implements CommandInterface {
    public readonly command = 'run-coin-vote-worker'
    public readonly description = 'This command runs CoinVote worker from cli'

    public constructor(
        private readonly coinVoteWorker: CoinVoteWorker,
    ) { }

    public builder(yargs: Argv<RunNoArgsWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunNoArgsWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.coinVoteWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
