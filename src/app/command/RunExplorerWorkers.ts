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
    ExplorerSearchAPIWorker,
    MailerService,
} from '../../core'

@singleton()
export class RunExplorerWorker implements CommandInterface {
    public readonly command = 'run-explorer-worker'
    public readonly description = 'Runs explorer worker'

    public constructor(
        private readonly bscScanAddressTokensHoldingsWorker: BSCScanAddressTokensHoldingsWorker,
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
            [ExplorerWorkerNames.EXPLORER_SEARCH]: this.explorerSearchAPIWorker,
        }

        try {
            if (ExplorerWorkerNames.HOLDINGS === workerName) {
                await this.runHoldingWorker(blockchain)
            } else if (ExplorerWorkerNames.TOKEN_CHECKER === workerName) {
                await this.runTokensCheckerWorker(blockchain)
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
            const ethWorker = this.bscScanAddressTokensHoldingsWorker.run(Blockchain.ETH)
            const bscWorker = this.bscScanAddressTokensHoldingsWorker.run(Blockchain.BSC)
            const croWorker = this.bscScanAddressTokensHoldingsWorker.run(Blockchain.CRO)
            const maticWorker = this.bscScanAddressTokensHoldingsWorker.run(Blockchain.MATIC)
            const solWorker = this.bscScanAddressTokensHoldingsWorker.run(Blockchain.SOL)

            await Promise.all([
                ethWorker,
                bscWorker,
                croWorker,
                maticWorker,
                solWorker,
            ])

            return
        }

        await this.bscScanAddressTokensHoldingsWorker.run(blockchain)
    }

    private async runTokensCheckerWorker(blockchain: Blockchain|null): Promise<void> {
        if (!blockchain) {
            const ethWorker = this.checkTokenBNBWorker.run(Blockchain.ETH)
            const bscWorker = this.checkTokenBNBWorker.run(Blockchain.BSC)
            const croWorker = this.checkTokenBNBWorker.run(Blockchain.CRO)
            const maticWorker = this.checkTokenBNBWorker.run(Blockchain.MATIC)

            await Promise.all([
                ethWorker,
                bscWorker,
                croWorker,
                maticWorker,
            ])

            return
        }

        await this.checkTokenBNBWorker.run(blockchain)
    }
}
