import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, RunBitQueryWorkerCmdArgv } from './types'
import { Blockchain, sleep } from '../utils'
import { BitQueryWorker, MailerService } from '../core'

@singleton()
export class RunBitQueryWorker implements CommandInterface {
    public readonly command = 'run-bit-query-worker'
    public readonly description = 'This command runs BitQuery worker from cli'

    public constructor(
        private readonly bitQueryWorker: BitQueryWorker,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunBitQueryWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunBitQueryWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.bitQueryWorker.run(argv.blockchain)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
