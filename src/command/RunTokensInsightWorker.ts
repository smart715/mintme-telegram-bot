import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { Logger } from 'winston'
import { CommandInterface, RunTokensInsightWorkerCmdArgv } from './types'
import { Blockchain } from '../utils'
import { MailerService, TokensInsightWorker } from '../core'

@singleton()
export class RunTokensInsightWorker implements CommandInterface {
    public readonly command = 'run-tokens-insight-worker'
    public readonly description = 'This command runs Tokens Insight worker from cli'

    public constructor(
        private readonly tokensInsightWorker: TokensInsightWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunTokensInsightWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunTokensInsightWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.tokensInsightWorker.run(argv.blockchain)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
