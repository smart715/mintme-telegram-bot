import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface, RunCoinBrainWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain, sleep } from '../utils'
import { CoinBrainWorker, MailerService } from '../core'

@singleton()
export class RunCoinBrainWorker implements CommandInterface {
    public readonly command = 'run-coin-brain-worker'
    public readonly description = 'This command runs Coin Brain worker from cli'

    public constructor(
        private readonly coinBrainWorker: CoinBrainWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunCoinBrainWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunCoinBrainWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.coinBrainWorker.run(argv.blockchain)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
