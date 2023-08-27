import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, RunCoinBuddyWorkerCmdArgv } from './types'
import { CoinBuddyWorker } from '../core'
import { Blockchain, sleep } from '../utils'

@singleton()
export class RunCoinBuddyWorker implements CommandInterface {
    public readonly command = 'run-coin-buddy-worker'
    public readonly description = 'This command runs Coin Buddy worker from cli'

    public constructor(
        private readonly coinBuddyWorker: CoinBuddyWorker,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunCoinBuddyWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunCoinBuddyWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.coinBuddyWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
