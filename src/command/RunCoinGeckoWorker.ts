import { singleton } from 'tsyringe'
import { CommandInterface, RunAdvnWorkerCmdArgv } from './types'
import { CoinGeckoWorker } from '../core'
import { Arguments, Argv } from 'yargs'
import { Blockchain, logger } from '../utils'

@singleton()
export class RunCoinGeckoWorker implements CommandInterface {
    public readonly command = 'run-coin-gecko-worker'
    public readonly description = 'This command runs CoinGecko worker from cli'

    public constructor(
        private readonly coinGeckoWorker: CoinGeckoWorker,
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

        await this.coinGeckoWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
