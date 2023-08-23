import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface, RunEnqueueTokenWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain } from '../utils'
import { EnqueueTokensWorker } from '../core'

@singleton()
export class RunEnqueueTokenWorker implements CommandInterface {
    public readonly command = 'run-enqueue-tokens-worker'
    public readonly description = 'Runs Enqueue tokens Worker'

    public constructor(
        private readonly enqueueTokensWorker: EnqueueTokensWorker,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunEnqueueTokenWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunEnqueueTokenWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.enqueueTokensWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
