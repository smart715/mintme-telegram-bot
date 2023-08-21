import { singleton } from 'tsyringe'
import { Arguments, Argv } from 'yargs'
import { CommandInterface, ParserWorkerName, RunParserWorkerCmdArgv } from './types'
import { Blockchain, logger } from '../utils'
import { CoinVoteWorker } from '../core/worker/parser/CoinVoteWorker'
import { CoinsHunterWorker } from '../core'

@singleton()
export class RunParserWorker implements CommandInterface {
    public readonly command = 'run-parser-worker'
    public readonly description = 'This command runs CoinVote worker from cli'

    public constructor(
        private readonly coinVoteWorker: CoinVoteWorker,
        private readonly coinsHunterWorker: CoinsHunterWorker,
    ) { }

    public builder(yargs: Argv<RunParserWorkerCmdArgv>): void {
        yargs.option('worker', {
            type: 'string',
            describe: 'Worker to run',
            demandOption: true,
        })
        yargs.option('blockchain', {
            type: 'string',
            describe: 'Blockchain to check',
            default: () => Blockchain.BSC,
            demandOption: false,
        })
    }

    public async handler(argv: Arguments<RunParserWorkerCmdArgv>): Promise<void> {
        logger.info(`Started command ${this.command}, worker ${argv.worker}`)

        switch (argv.worker) {
            case ParserWorkerName.COIN_VOTE:
                await this.coinVoteWorker.run(argv.blockchain)
            break
            case ParserWorkerName.COINS_HUNTER:
                await this.coinsHunterWorker.run(argv.blockchain)
            break
            default:
                logger.error('Wrong worker name provided')
            break
        }

        logger.info(`Command ${this.command} finished with success`)

        process.exit()
    }
}
