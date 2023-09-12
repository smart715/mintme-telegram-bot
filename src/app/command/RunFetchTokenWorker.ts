import { CasualTokenWorkerNames, CommandInterface, RunCasualTokenWorkerCmdArgv } from './types'
import {
    CMCWorker,
    Coin360Worker,
    CoinLoreWorker,
    CoinScopeWorker,
    CoinSniperWorker,
    CoinVoteWorker,
    CoinsGodsWorker,
    CoinsHunterWorker,
    CryptoVoteListWorker,
    EthplorerWorker,
    GemFinderWorker,
    MemeCoinsWorker,
    MobulaWorker,
    MyCoinVoteWorker,
    AdvnWorker,
    BitQueryWorker,
    CoinBrainWorker,
    CoinBuddyWorker,
    CoinCapWorker,
    CoinCatapultWorker,
    CoinCodexWorker,
    CoinDiscoveryWorker,
    CoinGeckoWorker,
    MyEtherListsWorker,
    RecentTokensWorker,
    RugFreeCoinsWorker,
    TokensInsightWorker,
    Top100TokensWorker,
} from '../../core'
import { Arguments, Argv } from 'yargs'
import { createLogger, sleep } from '../../utils'
import { singleton } from 'tsyringe'

@singleton()
export class RunFetchTokenWorker implements CommandInterface {
    public readonly command = 'run-fetch-token-worker'
    public readonly description = 'Runs fetch token worker'

    public constructor(
        private readonly cryptoVoteListWorker: CryptoVoteListWorker,
        private readonly ethplorerWorker: EthplorerWorker,
        private readonly gemFinderWorker: GemFinderWorker,
        private readonly memeCoinsWorker: MemeCoinsWorker,
        private readonly mobulaWorker: MobulaWorker,
        private readonly myCoinVoteWorker: MyCoinVoteWorker,
        private readonly coinVoteWorker: CoinVoteWorker,
        private readonly coinsHunterWorker: CoinsHunterWorker,
        private readonly coinsGodsWorker: CoinsGodsWorker,
        private readonly coin360Worker: Coin360Worker,
        private readonly coinSniperWorker: CoinSniperWorker,
        private readonly cmcWorker: CMCWorker,
        private readonly coinLoreWorker: CoinLoreWorker,
        private readonly coinScopeWorker: CoinScopeWorker,
        private readonly advnWorker: AdvnWorker,
        private readonly bitQueryWorker: BitQueryWorker,
        private readonly coinBrainWorker: CoinBrainWorker,
        private readonly coinBuddyWorker: CoinBuddyWorker,
        private readonly coinCapWorker: CoinCapWorker,
        private readonly coinCatapultWorker: CoinCatapultWorker,
        private readonly coinCodexWorker: CoinCodexWorker,
        private readonly coinDiscoveryWorker: CoinDiscoveryWorker,
        private readonly coinGeckoWorker: CoinGeckoWorker,
        private readonly myEtherListsWorker: MyEtherListsWorker,
        private readonly recentTokensWorker: RecentTokensWorker,
        private readonly rugFreeCoinsWorker: RugFreeCoinsWorker,
        private readonly tokensInsightWorker: TokensInsightWorker,
        private readonly top100TokensWorker: Top100TokensWorker,
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
            [CasualTokenWorkerNames.COIN_VOTE]: this.coinVoteWorker,
            [CasualTokenWorkerNames.COINS_HUNTER]: this.coinsHunterWorker,
            [CasualTokenWorkerNames.COINS_GODS]: this.coinsGodsWorker,
            [CasualTokenWorkerNames.COIN_360]: this.coin360Worker,
            [CasualTokenWorkerNames.COIN_SNIPER]: this.coinSniperWorker,
            [CasualTokenWorkerNames.COINMARKETCAP]: this.cmcWorker,
            [CasualTokenWorkerNames.COIN_LORE]: this.coinLoreWorker,
            [CasualTokenWorkerNames.COIN_SCOPE]: this.coinScopeWorker,
            [CasualTokenWorkerNames.ADVN]: this.advnWorker,
            [CasualTokenWorkerNames.BIT_QUERY]: this.bitQueryWorker,
            [CasualTokenWorkerNames.COIN_BRAIN]: this.coinBrainWorker,
            [CasualTokenWorkerNames.COIN_BUDDY]: this.coinBuddyWorker,
            [CasualTokenWorkerNames.COIN_CAP]: this.coinCapWorker,
            [CasualTokenWorkerNames.COIN_CATAPULT]: this.coinCatapultWorker,
            [CasualTokenWorkerNames.COIN_CODEX]: this.coinCodexWorker,
            [CasualTokenWorkerNames.COIN_DISCOVERY]: this.coinDiscoveryWorker,
            [CasualTokenWorkerNames.COIN_GECKO]: this.coinGeckoWorker,
            [CasualTokenWorkerNames.MY_ETHER_LISTS]: this.myEtherListsWorker,
            [CasualTokenWorkerNames.RECENT_TOKENS]: this.recentTokensWorker,
            [CasualTokenWorkerNames.RUG_FREE_COINS]: this.rugFreeCoinsWorker,
            [CasualTokenWorkerNames.TOKENS_INSIGHT]: this.tokensInsightWorker,
            [CasualTokenWorkerNames.TOP_100_TOKENS]: this.top100TokensWorker,
        }

        const worker = workers[workerName]

        const logger = createLogger(workers[workerName].constructor.name.toLowerCase())

        logger.info(`Started command ${this.command} --name ${workerName}`)

        await worker.run()

        logger.info(`Command ${this.command} finished with success`)

        await sleep(1000)

        process.exit()
    }
}
