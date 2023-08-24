import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { Logger } from 'winston'
import { CommandInterface, RunCoinCapWorkerCmdArgv } from './types'
import { CoinCapWorker } from '../core'
import { Blockchain, sleep } from '../utils'

@singleton()
export class RunCoinCapWorker implements CommandInterface {
    public readonly command = 'run-coin-cap-worker'
    public readonly description = 'This command runs Coin Cap worker from cli'

    public constructor(
        private readonly coinCapWorker: CoinCapWorker,
        private readonly logger: Logger,
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
        this.logger.info(`Started command ${this.command}`)

        await this.coinCapWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
