import { singleton } from 'tsyringe'
import { CommandInterface, RunCoinBrainWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain, logger } from '../utils'
import { CoinBrainWorker } from '../core'

@singleton()
export class RunCoinBrainWorker implements CommandInterface {
    public readonly command = 'run-coin-brain-worker'
    public readonly description = 'This command runs Coin Brain worker from cli'

    public constructor(
        private readonly coinBrainWorker: CoinBrainWorker,
    ) { }

    public builder(yargs: Argv<RunCoinBrainWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunCoinBrainWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.coinBrainWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
