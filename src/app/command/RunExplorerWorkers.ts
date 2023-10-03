import { singleton } from 'tsyringe'
import { CommandInterface, ExplorerWorkerNames, RunExplorerWorkerCmdArgv } from './types'
import { Arguments, Argv } from 'yargs'
import { Blockchain, sleep } from '../../utils'
import {
    BSCScanAddressTokensHoldingsWorker,
    BSCScanTokensTransactionsFetcher,
    BSCScanTopAccountsFetcher,
    BSCScanTopTokensFetcher,
    BSCScanValidatorsFetcher,
    CheckTokenBNBWorker,
    EtherScanAddressTokensHoldingsWorker,
    ExplorerSearchAPIWorker,
    MailerService,
} from '../../core'

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
        private readonly mailService: MailerService,
    ) { }

    public builder(yargs: Argv<RunExplorerWorkerCmdArgv>): void {
        yargs.option('name', {
            type: 'string',
            describe: `Worker name, has to be one of these: ${Object.values(ExplorerWorkerNames).join(', ')}`,
            demandOption: true,
        })

        yargs.option('blockchain', {
            type: 'string',
            describe: `Optional. Blockchain to check. If specified, has to be one of these ${Object.values(Blockchain).join(', ')}`,
            default: () => null,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunExplorerWorkerCmdArgv>): Promise<void> {
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

        try {
            if (ExplorerWorkerNames.HOLDINGS === workerName) {
                await this.runHoldingWorker(blockchain)
            } else {
                if (blockchain) {
                    await notHoldingWorkers[workerName].run(blockchain)
                } else {
                    await notHoldingWorkers[workerName].run()
                }
            }
        } catch (err) {
            await this.mailService.sendFailedWorkerEmail(
                `Error while running ${this.constructor.name}. ${workerName}`,
                err
            )

            throw err
        }

        await sleep(1000)

        process.exit()
    }

    private async runHoldingWorker(blockchain: Blockchain|null): Promise<void> {
        if (!blockchain) {
            const ethWorker = this.etherScanAddressTokensHoldingsWorker.run()
            const bscWorker = this.bscScanAddressTokensHoldingsWorker.run(Blockchain.BSC)
            const croWorker = this.bscScanAddressTokensHoldingsWorker.run(Blockchain.CRO)

            await Promise.all([ ethWorker, bscWorker, croWorker ])

            return
        }

        if (Blockchain.ETH === blockchain) {
            await this.etherScanAddressTokensHoldingsWorker.run()
        } else {
            await this.bscScanAddressTokensHoldingsWorker.run(blockchain)
        }
    }
}
