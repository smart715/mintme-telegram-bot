import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { BlockchainWorkerCmdArgv, CommandInterface } from './types'
import { Arguments, Argv } from 'yargs'
import { sleep } from '../../utils'
import { EthereumBasedBlockWatcher, MailerService } from '../../core'

@singleton()
export class RunEthereumBasedBlockchainWatcher implements CommandInterface {
    public readonly command = 'run-eth-based-blockchain-watcher'
    public readonly description = 'Runs Ethereum Based Blockchain Watcher'

    public constructor(
        private readonly ethereumBasedBlockWatcher: EthereumBasedBlockWatcher,
        private readonly mailService: MailerService,
        private readonly logger: Logger,
    ) { }

    public builder(yargs: Argv<BlockchainWorkerCmdArgv>): void {
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            demandOption: true,
        })
    }

    public async handler(argv: Arguments<BlockchainWorkerCmdArgv>): Promise<void> {
        this.logger.info(`Started command ${this.command}`)

        try {
            await this.ethereumBasedBlockWatcher.runByBlockchain(argv.blockchain)
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(`Error while running ${this.constructor.name}`, err)

            throw err
        }

        this.logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
