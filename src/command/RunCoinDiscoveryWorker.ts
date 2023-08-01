import { singleton } from 'tsyringe'
import { CommandInterface, RunCoinDiscoveryWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain, logger } from '../utils'
import { CoinDiscoveryWorker } from '../core'

@singleton()
export class RunCoinDiscoveryWorker implements CommandInterface {
    public readonly command = 'run-coin-discovery-worker'
    public readonly description = 'This command runs Coin Discovery worker from cli'

    public constructor(
        private readonly coinDiscoveryWorker: CoinDiscoveryWorker,
    ) { }

    public builder(yargs: Argv<RunCoinDiscoveryWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunCoinDiscoveryWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.coinDiscoveryWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
