import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CommandInterface, RunMyEtherListsWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain } from '../utils'
import { MyEtherListsWorker } from '../core'

@singleton()
export class RunMyEtherListsWorker implements CommandInterface {
    public readonly command = 'run-my-ether-lists-worker'
    public readonly description = 'This command runs My Ether Lists worker from cli'

    public constructor(
        private readonly myEtherListsWorker: MyEtherListsWorker,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<RunMyEtherListsWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunMyEtherListsWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        await this.myEtherListsWorker.run(argv.blockchain)

        this.logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
