import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { Logger } from 'winston'
import { CommandInterface, RunCoinCodexWorkerCmdArgv } from './types'
import { CoinCodexWorker, MailerService } from '../core'
import { Blockchain, sleep } from '../utils'

@singleton()
export class RunCoinCodexWorker implements CommandInterface {
    public readonly command = 'run-coin-codex-worker'
    public readonly description = 'This command runs Coin Codex worker from cli'

    public constructor(
        private readonly coinCodexWorker: CoinCodexWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunCoinCodexWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunCoinCodexWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.coinCodexWorker.run(argv.blockchain)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
