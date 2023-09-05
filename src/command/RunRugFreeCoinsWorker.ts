import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { Logger } from 'winston'
import { CommandInterface, RunRugFreeCoinsWorkerCmdArgv } from './types'
import { Blockchain } from '../utils'
import { RugFreeCoinsWorker } from '../core'

@singleton()
export class RunRugFreeCoinsWorker implements CommandInterface {
    public readonly command = 'run-rug-free-coins-worker'
    public readonly description = 'This command runs Rug Free Coins worker from cli'

    public constructor(
        private readonly rugFreeCoinsWorker: RugFreeCoinsWorker,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunRugFreeCoinsWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunRugFreeCoinsWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.rugFreeCoinsWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}