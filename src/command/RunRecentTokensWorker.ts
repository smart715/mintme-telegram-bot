import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { Logger } from 'winston'
import { CommandInterface, RunRecentTokensWorkerCmdArgv } from './types'
import { Blockchain } from '../utils'
import { RecentTokensWorker } from '../core'

@singleton()
export class RunRecentTokensWorker implements CommandInterface {
    public readonly command = 'run-recent-tokens-worker'
    public readonly description = 'This command runs RecentTokens worker from cli'

    public constructor(
        private readonly recentTokensWorker: RecentTokensWorker,
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

        await this.recentTokensWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
