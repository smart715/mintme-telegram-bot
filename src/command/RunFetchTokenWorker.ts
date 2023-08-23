import { CasualTokenWorkerNames, CommandInterface, RunCasualTokenWorkerCmdArgv } from './types'
import {
    CryptoVoteListWorker,
    EthplorerWorker,
    GemFinderWorker,
    MemeCoinsWorker,
    MobulaWorker,
    MyCoinVoteWorker,
} from '../core'
import { Arguments, Argv } from 'yargs'
import { createLogger } from '../utils'
import { singleton } from 'tsyringe'

@singleton()
export class RunFetchTokenWorker implements CommandInterface {
    public readonly command = 'run-casual-token-worker'
    public readonly description = 'Runs casual token worker'

    public constructor(
        private readonly cryptoVoteListWorker: CryptoVoteListWorker,
        private readonly ethplorerWorker: EthplorerWorker,
        private readonly gemFinderWorker: GemFinderWorker,
        private readonly memeCoinsWorker: MemeCoinsWorker,
        private readonly mobulaWorker: MobulaWorker,
        private readonly myCoinVoteWorker: MyCoinVoteWorker,
    ) { }

    public builder(yargs: Argv<RunCasualTokenWorkerCmdArgv>): void {
        yargs.option('name', {
            type: 'string',
            describe: `Worker name, has to be one of these: ${Object.values(CasualTokenWorkerNames).join(', ')}`,
            demandOption: true,
        })
    }

    public async handler(argv: Arguments<RunCasualTokenWorkerCmdArgv>): Promise<void> {
        const workerName = argv.name

        if (!Object.values(CasualTokenWorkerNames).includes(workerName)) {
            throw new Error('Wrong worker name')
        }

        const workers = {
            [CasualTokenWorkerNames.CRYPTO_VOTE_LIST]: this.cryptoVoteListWorker,
            [CasualTokenWorkerNames.ETH_PLORER]: this.ethplorerWorker,
            [CasualTokenWorkerNames.GEM_FINDER]: this.gemFinderWorker,
            [CasualTokenWorkerNames.MEME_COIN]: this.memeCoinsWorker,
            [CasualTokenWorkerNames.MOBULA]: this.mobulaWorker,
            [CasualTokenWorkerNames.MY_COIN_VOTE]: this.myCoinVoteWorker,
        }

        const worker = workers[workerName]

        const logger = createLogger(workers[workerName].constructor.name.toLowerCase())

        logger.info(`Started command ${this.command} --name ${workerName}`)

        await worker.run()

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
