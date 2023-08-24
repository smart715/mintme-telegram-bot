import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { Logger } from 'winston'
import { CommandInterface, RunCoinCatapultWorkerCmdArgv } from './types'
import { CoinCatapultWorker } from '../core'
import { Blockchain, sleep } from '../utils'

@singleton()
export class RunCoinCatapultWorker implements CommandInterface {
    public readonly command = 'run-coin-catapult-worker'
    public readonly description = 'This command runs Coin Catapult worker from cli'

    public constructor(
        private readonly coinCatapultWorker: CoinCatapultWorker,
        private readonly logger: Logger,
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
        this.logger.info(`Started command ${this.command}`)

        await this.coinCatapultWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
