import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface, RunCoinGeckoWorkerCmdArgv } from './types'
import { CoinGeckoWorker } from '../core'
import { Arguments, Argv } from 'yargs'
import { Blockchain, sleep } from '../utils'

@singleton()
export class RunCoinGeckoWorker implements CommandInterface {
    public readonly command = 'run-coin-gecko-worker'
    public readonly description = 'This command runs Coin Gecko worker from cli'

    public constructor(
        private readonly coinGeckoWorker: CoinGeckoWorker,
        private readonly logger: Logger,
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
        this.logger.info(`Started command ${this.command}`)

        await this.coinGeckoWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
