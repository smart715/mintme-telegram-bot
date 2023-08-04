import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, RunCoinCatapultWorkerCmdArgv } from './types'
import { CoinCatapultWorker } from '../core'
import { Blockchain, logger } from '../utils'

@singleton()
export class RunCoinCatapultWorker implements CommandInterface {
    public readonly command = 'run-coin-catapult-worker'
    public readonly description = 'This command runs Coin Catapult worker from cli'

    public constructor(
        private readonly coinCatapultWorker: CoinCatapultWorker,
    ) { }

    public builder(yargs: Argv<RunCoinCatapultWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunCoinCatapultWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        await this.coinCatapultWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
