import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, RunTokensInsightWorkerCmdArgv } from './types'
import { Blockchain, logger } from '../utils'
import { TokensInsightWorker } from '../core'

@singleton()
export class RunTokensInsightWorker implements CommandInterface {
    public readonly command = 'run-tokens-insight-worker'
    public readonly description = 'This command runs Tokens Insight worker from cli'

    public constructor(
        private readonly tokensInsightWorker: TokensInsightWorker,
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
        logger.info(`Started command ${this.command}`)

        await this.tokensInsightWorker.run(argv.blockchain)

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
