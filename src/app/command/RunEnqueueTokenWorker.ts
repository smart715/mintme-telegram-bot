import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface, BlockchainWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { sleep } from '../../utils'
import { EnqueueTokensWorker, MailerService } from '../../core'

@singleton()
export class RunEnqueueTokenWorker implements CommandInterface {
    public readonly command = 'run-enqueue-tokens-worker'
    public readonly description = 'Runs Enqueue tokens Worker'

    public constructor(
        private readonly enqueueTokensWorker: EnqueueTokensWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<BlockchainWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => undefined,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<BlockchainWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.enqueueTokensWorker.run(argv.blockchain)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
