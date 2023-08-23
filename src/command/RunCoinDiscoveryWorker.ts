import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { Logger } from 'winston'
import { CommandInterface, RunCoinDiscoveryWorkerCmdArgv } from './types'
import { Blockchain } from '../utils'
import { CoinDiscoveryWorker } from '../core'

@singleton()
export class RunCoinDiscoveryWorker implements CommandInterface {
    public readonly command = 'run-coin-discovery-worker'
    public readonly description = 'This command runs Coin Discovery worker from cli'

    public constructor(
        private readonly coinDiscoveryWorker: CoinDiscoveryWorker,
        private readonly logger: Logger,
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
        this.logger.info(`Started command ${this.command}`)

        await this.coinDiscoveryWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
