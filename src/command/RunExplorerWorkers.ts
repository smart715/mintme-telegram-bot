import { singleton } from 'tsyringe'
import { CommandInterface, ExplorerWorkerNames, RunExplorerWorkerCmdArgv, RunQueueWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain, logger } from '../utils'
import {
    BSCScanAddressTokensHoldingsWorker,
    BSCScanTokensTransactionsFetcher,
    BSCScanTopAccountsFetcher,
    BSCScanTopTokensFetcher,
    BSCScanValidatorsFetcher,
    CheckTokenBNBWorker,
    EtherScanAddressTokensHoldingsWorker,
    ExplorerSearchAPIWorker,
} from '../core'

@singleton()
export class RunExplorerWorker implements CommandInterface {
    public readonly command = 'run-explorer-worker'
    public readonly description = 'Runs explorer worker'

    public constructor(
        private readonly bscScanAddressTokensHoldingsWorker: BSCScanAddressTokensHoldingsWorker,
        private readonly etherScanAddressTokensHoldingsWorker: EtherScanAddressTokensHoldingsWorker,
        private readonly bscScanTokensTransactionsFetcher: BSCScanTokensTransactionsFetcher,
        private readonly bscScanTopAccountsFetcher: BSCScanTopAccountsFetcher,
        private readonly bscScanTopTokensFetcher: BSCScanTopTokensFetcher,
        private readonly bscScanValidatorsFetcher: BSCScanValidatorsFetcher,
        private readonly checkTokenBNBWorker: CheckTokenBNBWorker,
        private readonly explorerSearchAPIWorker: ExplorerSearchAPIWorker,
    ) { }

    public builder(yargs: Argv<RunQueueWorkerCmdArgv>): void {
        yargs.option('name', {
            type: 'string',
            describe: `Worker name, has to be one of these: ${Object.values(ExplorerWorkerNames).join(', ')}`,
            demandOption: true,
        })

        yargs.option('blockchain', {
            type: 'string',
            describe: `Blockchain to check, has to be one of these ${Object.values(Blockchain).join(', ')}`,
            demandOption: true,
        })
    }

    public async handler(argv: Arguments<RunExplorerWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}`)

        const workerName = argv.name
        const blockchain = argv.blockchain
        const notHoldingWorkers = {
            [ExplorerWorkerNames.TRANSACTIONS]: this.bscScanTokensTransactionsFetcher,
            [ExplorerWorkerNames.TOP_ACCOUNTS]: this.bscScanTopAccountsFetcher,
            [ExplorerWorkerNames.TOP_TOKENS]: this.bscScanTopTokensFetcher,
            [ExplorerWorkerNames.VALIDATORS]: this.bscScanValidatorsFetcher,
            [ExplorerWorkerNames.TOKEN_CHECKER]: this.checkTokenBNBWorker,
            [ExplorerWorkerNames.EXPLORER_SEARCH]: this.explorerSearchAPIWorker,
        }

        if (ExplorerWorkerNames.HOLDINGS === workerName) {
            await this.runHoldingWorker(blockchain)
        } else {
            await notHoldingWorkers[workerName].run(blockchain)
        }

        logger.info(`Command ${this.command} finished with success`)
    }

    private async runHoldingWorker(blockchain: Blockchain): Promise<void> {
        if (Blockchain.ETH === blockchain) {
            await this.etherScanAddressTokensHoldingsWorker.run()
        } else {
            await this.bscScanAddressTokensHoldingsWorker.run(blockchain)
        }
    }
}
