import { singleton } from 'tsyringe'
import { CommandInterface, RunCoinGeckoWorkerCmdArgv } from './types'
import { CoinGeckoWorker } from '../core'
import { Arguments, Argv } from 'yargs'
import { Blockchain, logger } from '../utils'

@singleton()
export class RunCoinGeckoWorker implements CommandInterface {
    public readonly command = 'run-coin-gecko-worker'
    public readonly description = 'This command runs Coin Gecko worker from cli'

    public constructor(
        private readonly coinGeckoWorker: CoinGeckoWorker,
    ) { }

    public builder(yargs: Argv<RunCoinGeckoWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunCoinGeckoWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.coinGeckoWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
