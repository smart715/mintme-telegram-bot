import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, RunCoinCapWorkerCmdArgv } from './types'
import { CoinCapWorker} from '../core'
import { Blockchain, logger } from '../utils'

@singleton()
export class RunCoinCapWorker implements CommandInterface {
    public readonly command = 'run-coin-buddy-worker'
    public readonly description = 'This command runs Coin Buddy worker from cli'

    public constructor(
        private readonly coinCapWorker: CoinCapWorker,
    ) { }

    public builder(yargs: Argv<RunCoinCapWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunCoinCapWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.coinCapWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
