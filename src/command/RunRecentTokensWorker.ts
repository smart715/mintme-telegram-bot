import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { Logger } from 'winston'
import { CommandInterface, RunRecentTokensWorkerCmdArgv } from './types'
import { Blockchain } from '../utils'
import { MailerService, RecentTokensWorker } from '../core'

@singleton()
export class RunRecentTokensWorker implements CommandInterface {
    public readonly command = 'run-recent-tokens-worker'
    public readonly description = 'This command runs RecentTokens worker from cli'

    public constructor(
        private readonly recentTokensWorker: RecentTokensWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunRecentTokensWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunRecentTokensWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.recentTokensWorker.run(argv.blockchain)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }


        this.logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
