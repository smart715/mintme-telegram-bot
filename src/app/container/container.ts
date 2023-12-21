import config from 'config'
import { container, instanceCachingFactory } from 'tsyringe'
import {
    CMCWorker,
    ContactHistoryService,
    ContactQueueService,
    EnqueueTokensWorker,
    MintmeService,
    QueueWorker,
    SeleniumService,
    TokensService,
    DuplicatesFoundService,
    ExplorerEnqueuer,
    QueuedWalletAddressService,
    QueuedTokenAddressService,
    LastCheckedTokenNameService,
    BSCScanAddressTokensHoldingsWorker,
    BSCScanTokensTransactionsFetcher,
    BSCScanTopAccountsFetcher,
    BSCScanTopTokensFetcher,
    BSCScanValidatorsFetcher,
    CheckTokenBNBWorker,
    ExplorerSearchAPIWorker,
    ContactHistoryRepository,
    ContactMessageRepository,
    DuplicatesFoundRepository,
    LastCheckedTokenNameRepository,
    QueuedContactRepository,
    QueuedTokenAddressRepository,
    QueuedWalletAddressRepository,
    TokenRepository,
    TelegramAccountsRepository,
    TelegramWorker,
    TelegramService,
    TelegramResponseRepository,
    ContactMessageService,
    LastTokenTxDateFetcher,
    ProxyServerRepository,
    ProxyService,
    CoinGeckoService,
    CoinGeckoWorker,
    AdvnWorker,
    AdvnService,
    CoinDiscoveryService,
    CoinDiscoveryWorker,
    CoinBrainService,
    CoinBrainWorker,
    CoinBuddyService,
    CoinBuddyWorker,
    CoinCapWorker,
    CoinCapService,
    CoinCatapultService,
    CoinCatapultWorker,
    CoinCodexWorker,
    CoinCodexService,
    BitQueryService,
    BitQueryWorker,
    CoinVoteWorker,
    CoinsHunterWorker,
    CoinsGodsWorker,
    CoinSniperWorker,
    CoinLoreWorker,
    CoinScopeWorker,
    Coin360Worker,
    NewestCheckedTokenService,
    NewestCheckedTokenRepository,
    CryptoVoteListWorker,
    EthplorerWorker,
    GemFinderWorker,
    MemeCoinsWorker,
    MobulaWorker,
    MyCoinVoteWorker,
    MailerService,
    MailerWorker,
    RugFreeCoinsService,
    RugFreeCoinsWorker,
    Top100TokensService,
    Top100TokensWorker,
    TokensInsightService,
    TokensInsightWorker,
    MyEtherListsService,
    MyEtherListsWorker,
    RecentTokensService,
    RecentTokensWorker,
    CheckedTokenRepository,
    CheckedTokenService,
    CoinLoreService,
    CMCService,
    CoinScopeService,
    CoinSniperService,
    BSCScanService,
    CoinVoteService,
    Coins360Service,
    CoinsGodsService,
    CoinsHunterService,
    FirewallService,
    TwitterWorker,
    TwitterAccountRepository,
    TwitterService,
    DailyStatisticMailWorker,
    TwitterResponseRepository,
    BlacklistRepository,
    CoinMarketCapAccountRepository,
    CoinMarketCommentWorker,
    CoinMarketCapCommentRepository,
    CoinMarketCapCommentHistoryRepository,
} from '../../core'
import { Application } from '../'
import { CliDependency } from './types'
import { getConnection } from 'typeorm'
import {
    RunEnqueueTokenWorker,
    RunQueueWorker,
    RunExplorerWorker,
    RunTelegramWorker,
    RunLastTokenTxDateFetcher,
    RunFetchTokenWorker,
    RunMailerWorker,
    RunTwitterWorker,
    RunDailyStatisticMailWorker,
    RunCMCCommentsWorker,
} from '../command'
import { RetryAxios, TokenNamesGenerator, createLogger, Environment } from '../../utils'

// Env

export const environment: Environment = 'production' === config.get('environment')
    ? Environment.PRODUCTION
    : Environment.DEVELOPMENT


// Loggers

const top100TokensLogger = createLogger(Top100TokensWorker.name.toLowerCase())
const tokensInsightLogger = createLogger(TokensInsightWorker.name.toLowerCase())
const rugFreeCoinsLogger = createLogger(RugFreeCoinsWorker.name.toLowerCase())
const recentTokensLogger = createLogger(RecentTokensWorker.name.toLowerCase())
const myEtherListsLogger = createLogger(MyEtherListsWorker.name.toLowerCase())
const advnLogger = createLogger(AdvnWorker.name.toLowerCase())
const bitQueryLogger = createLogger(BitQueryWorker.name.toLowerCase())
const coinBrainLogger = createLogger(CoinBrainWorker.name.toLowerCase())
const coinBuddyLogger = createLogger(CoinBuddyWorker.name.toLowerCase())
const coinCapLogger = createLogger(CoinCapWorker.name.toLowerCase())
const coinCatapultLogger = createLogger(CoinCatapultWorker.name.toLowerCase())
const coinCodexLogger = createLogger(CoinCodexWorker.name.toLowerCase())
const coinDiscoveryLogger = createLogger(CoinDiscoveryWorker.name.toLowerCase())
const coinGeckoLogger = createLogger(CoinGeckoWorker.name.toLowerCase())
const enqueueTokenLogger = createLogger(EnqueueTokensWorker.name.toLowerCase())
const lastTokenTxDateFetcherLogger = createLogger(LastTokenTxDateFetcher.name.toLowerCase())
const queueLogger = createLogger(QueueWorker.name.toLowerCase())
const telegramLogger = createLogger(TelegramWorker.name.toLowerCase())
const mailerLogger = createLogger(MailerWorker.name.toLowerCase())
const twitterLogger = createLogger(TwitterWorker.name.toLowerCase())
const dailyStatisticMailLogger = createLogger(DailyStatisticMailWorker.name.toLowerCase())

// Repositories

container.register(TokenRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(TokenRepository)),
})

container.register(ContactHistoryRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(ContactHistoryRepository)),
})

container.register(ContactMessageRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(ContactMessageRepository)),
})

container.register(QueuedContactRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(QueuedContactRepository)),
})

container.register(TelegramAccountsRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(TelegramAccountsRepository)),
})

container.register(ProxyServerRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(ProxyServerRepository)),
})

container.register(DuplicatesFoundRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(DuplicatesFoundRepository)),
})

container.register(LastCheckedTokenNameRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(LastCheckedTokenNameRepository)),
})

container.register(QueuedTokenAddressRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(QueuedTokenAddressRepository)),
})

container.register(QueuedWalletAddressRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(QueuedWalletAddressRepository)),
})

container.register(TelegramResponseRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(TelegramResponseRepository)),
})

container.register(NewestCheckedTokenRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(NewestCheckedTokenRepository)),
})

container.register(CheckedTokenRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(CheckedTokenRepository)),
})

container.register(TwitterAccountRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(TwitterAccountRepository)),
})

container.register(TwitterResponseRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(TwitterResponseRepository)),
})

container.register(BlacklistRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(BlacklistRepository)),
})

container.register(CoinMarketCapAccountRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(CoinMarketCapAccountRepository)),
})

container.register(CoinMarketCapCommentRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(CoinMarketCapCommentRepository)),
})

container.register(CoinMarketCapCommentHistoryRepository, {
    useFactory: instanceCachingFactory(() =>
        getConnection().getCustomRepository(CoinMarketCapCommentHistoryRepository)),
})

// Utils

container.register(TokenNamesGenerator, {
    useFactory: instanceCachingFactory(() => new TokenNamesGenerator()),
})

container.register(RetryAxios, {
    useFactory: instanceCachingFactory(() => new RetryAxios()),
})

// Services

container.register(FirewallService, {
    useFactory: instanceCachingFactory(() => new FirewallService()),
})

container.register(MintmeService, {
    useFactory: instanceCachingFactory(() => new MintmeService()),
})

container.register(CoinGeckoService, {
    useFactory: instanceCachingFactory(() => new CoinGeckoService()),
})

container.register(AdvnService, {
    useFactory: instanceCachingFactory(() => new AdvnService()),
})

container.register(TokensService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new TokensService(
            dependencyContainer.resolve(TokenRepository),
        )
    ),
})

container.register(ProxyService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ProxyService(
            dependencyContainer.resolve(ProxyServerRepository),
        )
    ),
})

container.register(SeleniumService, {
    useFactory: instanceCachingFactory(() => new SeleniumService()),
})

container.register(DuplicatesFoundService, {
    useFactory: instanceCachingFactory((dependencyContainer) => new DuplicatesFoundService(
        dependencyContainer.resolve(DuplicatesFoundRepository),
    )),
})

container.register(LastCheckedTokenNameService, {
    useFactory: instanceCachingFactory((dependencyContainer) => new LastCheckedTokenNameService(
        dependencyContainer.resolve(LastCheckedTokenNameRepository),
    )),
})

container.register(QueuedTokenAddressService, {
    useFactory: instanceCachingFactory((dependencyContainer) => new QueuedTokenAddressService(
        dependencyContainer.resolve(QueuedTokenAddressRepository),
        dependencyContainer.resolve(DuplicatesFoundService),
        dependencyContainer.resolve(TokensService),
    )),
})

container.register(QueuedWalletAddressService, {
    useFactory: instanceCachingFactory((dependencyContainer) => new QueuedWalletAddressService(
        dependencyContainer.resolve(QueuedWalletAddressRepository),
        dependencyContainer.resolve(DuplicatesFoundService),
    )),
})

container.register(ContactMessageService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ContactMessageService(
            dependencyContainer.resolve(ContactMessageRepository),
            dependencyContainer.resolve(ContactHistoryService),
        )
    ),
})

container.register(ContactQueueService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ContactQueueService(
            dependencyContainer.resolve(QueuedContactRepository),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(ProxyService),
            dependencyContainer.resolve(ContactHistoryService),
        ),
    ),
})

container.register(ContactHistoryService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ContactHistoryService(
            dependencyContainer.resolve(ContactHistoryRepository)
        )
    ),
})

container.register(CheckedTokenService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CheckedTokenService(
            dependencyContainer.resolve(CheckedTokenRepository)
        ),
    ),
})

container.register(NewestCheckedTokenService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new NewestCheckedTokenService(
            dependencyContainer.resolve(NewestCheckedTokenRepository),
        ),
    ),
})

container.register(CoinDiscoveryService, {
    useFactory: instanceCachingFactory(() => new CoinDiscoveryService()),
})

container.register(CoinBrainService, {
    useFactory: instanceCachingFactory(() => new CoinBrainService()),
})

container.register(CoinBuddyService, {
    useFactory: instanceCachingFactory(() => new CoinBuddyService()),
})

container.register(CoinCapService, {
    useFactory: instanceCachingFactory(() => new CoinCapService()),
})

container.register(CoinCatapultService, {
    useFactory: instanceCachingFactory(() => new CoinCatapultService()),
})

container.register(CoinCodexService, {
    useFactory: instanceCachingFactory(() => new CoinCodexService()),
})

container.register(BitQueryService, {
    useFactory: instanceCachingFactory(() => new BitQueryService()),
})

container.register(MailerService, {
    useFactory: instanceCachingFactory(() => new MailerService()),
})

container.register(RugFreeCoinsService, {
    useFactory: instanceCachingFactory(() => new RugFreeCoinsService()),
})

container.register(Top100TokensService, {
    useFactory: instanceCachingFactory(() => new Top100TokensService()),
})

container.register(TokensInsightService, {
    useFactory: instanceCachingFactory(() => new TokensInsightService()),
})

container.register(MyEtherListsService, {
    useFactory: instanceCachingFactory(() => new MyEtherListsService()),
})

container.register(RecentTokensService, {
    useFactory: instanceCachingFactory(() => new RecentTokensService()),
})

container.register(CoinLoreService, {
    useFactory: instanceCachingFactory(() => new CoinLoreService()),
})

container.register(CMCService, {
    useFactory: instanceCachingFactory((dependencyContainer) => new CMCService(
        dependencyContainer.resolve(CoinMarketCapAccountRepository),
        dependencyContainer.resolve(CoinMarketCapCommentRepository),
        dependencyContainer.resolve(CoinMarketCapCommentHistoryRepository),
    )),
})

container.register(CoinScopeService, {
    useFactory: instanceCachingFactory(() => new CoinScopeService()),
})

container.register(CoinSniperService, {
    useFactory: instanceCachingFactory(() => new CoinSniperService()),
})

container.register(BSCScanService, {
    useFactory: instanceCachingFactory(() => new BSCScanService()),
})

container.register(CoinVoteService, {
    useFactory: instanceCachingFactory(() => new CoinVoteService()),
})

container.register(Coins360Service, {
    useFactory: instanceCachingFactory(() => new Coins360Service()),
})

container.register(CoinsGodsService, {
    useFactory: instanceCachingFactory(() => new CoinsGodsService()),
})

container.register(CoinsHunterService, {
    useFactory: instanceCachingFactory(() => new CoinsHunterService()),
})

container.register(TwitterService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new TwitterService(
            dependencyContainer.resolve(TwitterAccountRepository),
            dependencyContainer.resolve(TwitterResponseRepository),
        ),
    ),
})

// Workers

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(CMCWorker.name.toLowerCase()),
        ),
    ),
})

container.register(ExplorerEnqueuer, {
    useFactory: instanceCachingFactory((dependencyContainer) => new ExplorerEnqueuer(
        dependencyContainer.resolve(QueuedTokenAddressService),
        dependencyContainer.resolve(QueuedWalletAddressService),
    )),
})

container.register(EnqueueTokensWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new EnqueueTokensWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(MintmeService),
            dependencyContainer.resolve(ContactHistoryService),
            dependencyContainer.resolve(ContactQueueService),
            enqueueTokenLogger,
        ),
    ),
})

container.register(CoinGeckoWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinGeckoWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CoinGeckoService),
            dependencyContainer.resolve(CheckedTokenService),
            coinGeckoLogger
        ),
    ),
})

container.register(QueueWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new QueueWorker(
            dependencyContainer.resolve(ContactQueueService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(ContactHistoryService),
            dependencyContainer.resolve(EnqueueTokensWorker),
            queueLogger,
        ),
    ),
})

container.register(BSCScanAddressTokensHoldingsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanAddressTokensHoldingsWorker(
            dependencyContainer.resolve(QueuedWalletAddressService),
            dependencyContainer.resolve(ExplorerEnqueuer),
            dependencyContainer.resolve(FirewallService),
            createLogger(BSCScanAddressTokensHoldingsWorker.name.toLowerCase())
        )
    ),
})

container.register(BSCScanTokensTransactionsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTokensTransactionsFetcher(
            dependencyContainer.resolve(BSCScanService),
            dependencyContainer.resolve(FirewallService),
            dependencyContainer.resolve(ExplorerEnqueuer),
            createLogger(BSCScanTokensTransactionsFetcher.name.toLowerCase())
        )
    ),
})

container.register(BSCScanTopAccountsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTopAccountsFetcher(
            dependencyContainer.resolve(BSCScanService),
            dependencyContainer.resolve(FirewallService),
            dependencyContainer.resolve(ExplorerEnqueuer),
            createLogger(BSCScanTopAccountsFetcher.name.toLowerCase())
        )
    ),
})

container.register(BSCScanTopTokensFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTopTokensFetcher(
            dependencyContainer.resolve(BSCScanService),
            dependencyContainer.resolve(FirewallService),
            dependencyContainer.resolve(ExplorerEnqueuer),
            createLogger(BSCScanTopTokensFetcher.name.toLowerCase())
        )
    ),
})

container.register(BSCScanValidatorsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanValidatorsFetcher(
            dependencyContainer.resolve(ExplorerEnqueuer),
            createLogger(BSCScanValidatorsFetcher.name.toLowerCase())
        )
    ),
})

container.register(CheckTokenBNBWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CheckTokenBNBWorker(
            dependencyContainer.resolve(QueuedTokenAddressService),
            dependencyContainer.resolve(TokensService),
            createLogger(CheckTokenBNBWorker.name.toLowerCase())
        )
    ),
})

container.register(ExplorerSearchAPIWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ExplorerSearchAPIWorker(
            dependencyContainer.resolve(TokenNamesGenerator),
            dependencyContainer.resolve(LastCheckedTokenNameService),
            dependencyContainer.resolve(ExplorerEnqueuer),
            createLogger(ExplorerSearchAPIWorker.name.toLowerCase())
        )
    ),
})

container.register(TelegramWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new TelegramWorker(
            dependencyContainer.resolve(TelegramService),
            dependencyContainer.resolve(ContactHistoryService),
            dependencyContainer.resolve(ContactMessageService),
            dependencyContainer.resolve(ContactQueueService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(ProxyService),
            dependencyContainer.resolve(MailerService),
            environment,
            telegramLogger,
        )
    ),
})

container.register(LastTokenTxDateFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new LastTokenTxDateFetcher(
            dependencyContainer.resolve(TokensService),
            lastTokenTxDateFetcherLogger,
        )
    ),
})

container.register(AdvnWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new AdvnWorker(
            dependencyContainer.resolve(AdvnService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            advnLogger,
        )
    ),
})

container.register(CoinDiscoveryWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinDiscoveryWorker(
            dependencyContainer.resolve(CoinDiscoveryService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            coinDiscoveryLogger,
        )
    ),
})

container.register(CoinBrainWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinBrainWorker(
            dependencyContainer.resolve(CoinBrainService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            coinBrainLogger,
        )
    ),
})

container.register(CoinBuddyWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinBuddyWorker(
            dependencyContainer.resolve(CoinBuddyService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            coinBuddyLogger,
        )
    ),
})

container.register(CoinCapWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinCapWorker(
            dependencyContainer.resolve(CoinCapService),
            dependencyContainer.resolve(QueuedTokenAddressService),
            coinCapLogger,
        )
    ),
})

container.register(CryptoVoteListWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CryptoVoteListWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(RetryAxios),
            createLogger(CryptoVoteListWorker.name.toLowerCase())
        )
    ),
})

container.register(EthplorerWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new EthplorerWorker(
            dependencyContainer.resolve(TokenNamesGenerator),
            dependencyContainer.resolve(LastCheckedTokenNameService),
            dependencyContainer.resolve(TokensService),
            createLogger(EthplorerWorker.name.toLowerCase())
        )
    ),
})

container.register(GemFinderWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new GemFinderWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(GemFinderWorker.name.toLowerCase())
        )
    ),
})

container.register(MemeCoinsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MemeCoinsWorker(
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
            createLogger(MemeCoinsWorker.name.toLowerCase())
        )
    ),
})

container.register(MobulaWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MobulaWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(MobulaWorker.name.toLowerCase())
        )
    ),
})

container.register(MyCoinVoteWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MyCoinVoteWorker(
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
            createLogger(MyCoinVoteWorker.name.toLowerCase())
        )
    ),
})

container.register(RugFreeCoinsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RugFreeCoinsWorker(
            dependencyContainer.resolve(RugFreeCoinsService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            rugFreeCoinsLogger,
        )
    ),
})

container.register(Top100TokensWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new Top100TokensWorker(
            dependencyContainer.resolve(Top100TokensService),
            dependencyContainer.resolve(TokensService),
            top100TokensLogger,
        )
    ),
})

container.register(CoinCatapultWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinCatapultWorker(
            dependencyContainer.resolve(CoinCatapultService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            coinCatapultLogger,
        )
    ),
})

container.register(CoinCodexWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinCodexWorker(
            dependencyContainer.resolve(CoinCodexService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            coinCodexLogger,
        )
    ),
})

container.register(BitQueryWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BitQueryWorker(
            dependencyContainer.resolve(BitQueryService),
            dependencyContainer.resolve(QueuedTokenAddressService),
            bitQueryLogger,
        )
    ),
})

container.register(TokensInsightWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new TokensInsightWorker(
            dependencyContainer.resolve(TokensInsightService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            tokensInsightLogger,
        )
    ),
})

container.register(CoinVoteWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinVoteWorker(
            dependencyContainer.resolve(CoinVoteService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(CoinVoteWorker.name.toLowerCase()),
        )
    ),
})

container.register(MyEtherListsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MyEtherListsWorker(
            dependencyContainer.resolve(MyEtherListsService),
            dependencyContainer.resolve(TokensService),
            myEtherListsLogger,
        )
    ),
})

container.register(CoinsHunterWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinsHunterWorker(
            dependencyContainer.resolve(CoinsHunterService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(NewestCheckedTokenService),
            createLogger(CoinsHunterWorker.name.toLowerCase()),
        )
    ),
})

container.register(RecentTokensWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RecentTokensWorker(
            dependencyContainer.resolve(RecentTokensService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(NewestCheckedTokenService),
            recentTokensLogger,
        )
    ),
})

container.register(CoinsGodsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinsGodsWorker(
            dependencyContainer.resolve(CoinsGodsService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(CoinsGodsWorker.name.toLowerCase()),
        )
    ),
})

container.register(Coin360Worker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new Coin360Worker(
            dependencyContainer.resolve(Coins360Service),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(Coin360Worker.name.toLowerCase()),
        )
    ),
})

container.register(CoinSniperWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinSniperWorker(
            dependencyContainer.resolve(CoinSniperService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(FirewallService),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(CoinSniperWorker.name.toLowerCase()),
        )
    ),
})

container.register(CoinLoreWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinLoreWorker(
            dependencyContainer.resolve(CoinLoreService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(CoinLoreWorker.name.toLowerCase()),
        )
    ),
})

container.register(CoinScopeWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinScopeWorker(
            dependencyContainer.resolve(CoinScopeService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CheckedTokenService),
            createLogger(CoinScopeWorker.name.toLowerCase()),
        )
    ),
})

container.register(MailerWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MailerWorker(
            dependencyContainer.resolve(ContactQueueService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(ContactMessageService),
            dependencyContainer.resolve(ContactHistoryService),
            dependencyContainer.resolve(MailerService),
            mailerLogger,
        )
    ),
})

container.register(TwitterWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new TwitterWorker(
            dependencyContainer.resolve(TwitterService),
            dependencyContainer.resolve(ContactHistoryService),
            dependencyContainer.resolve(ContactMessageService),
            dependencyContainer.resolve(ContactQueueService),
            dependencyContainer.resolve(TokensService),
            environment,
            dependencyContainer.resolve(MailerService),
            twitterLogger,
        )
    ),
})

container.register(DailyStatisticMailWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new DailyStatisticMailWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(MailerService),
            dependencyContainer.resolve(ContactHistoryService),
            dailyStatisticMailLogger,
        )
    ),
})

container.register(CoinMarketCommentWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinMarketCommentWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(MailerService),
            createLogger(CMCWorker.name.toLowerCase())
        )
    ),
})

// CLI

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunEnqueueTokenWorker(
            dependencyContainer.resolve(EnqueueTokensWorker),
            dependencyContainer.resolve(MailerService),
            enqueueTokenLogger
        ),
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunQueueWorker(
            dependencyContainer.resolve(QueueWorker),
            dependencyContainer.resolve(MailerService),
            queueLogger,
        ),
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunExplorerWorker(
            dependencyContainer.resolve(BSCScanAddressTokensHoldingsWorker),
            dependencyContainer.resolve(BSCScanTokensTransactionsFetcher),
            dependencyContainer.resolve(BSCScanTopAccountsFetcher),
            dependencyContainer.resolve(BSCScanTopTokensFetcher),
            dependencyContainer.resolve(BSCScanValidatorsFetcher),
            dependencyContainer.resolve(CheckTokenBNBWorker),
            dependencyContainer.resolve(ExplorerSearchAPIWorker),
            dependencyContainer.resolve(MailerService),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunMailerWorker(
            dependencyContainer.resolve(MailerWorker),
            dependencyContainer.resolve(MailerService),
            mailerLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunLastTokenTxDateFetcher(
            dependencyContainer.resolve(LastTokenTxDateFetcher),
            dependencyContainer.resolve(MailerService),
            lastTokenTxDateFetcherLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunFetchTokenWorker(
            dependencyContainer.resolve(CryptoVoteListWorker),
            dependencyContainer.resolve(EthplorerWorker),
            dependencyContainer.resolve(GemFinderWorker),
            dependencyContainer.resolve(MemeCoinsWorker),
            dependencyContainer.resolve(MobulaWorker),
            dependencyContainer.resolve(MyCoinVoteWorker),
            dependencyContainer.resolve(CoinVoteWorker),
            dependencyContainer.resolve(CoinsHunterWorker),
            dependencyContainer.resolve(CoinsGodsWorker),
            dependencyContainer.resolve(Coin360Worker),
            dependencyContainer.resolve(CoinSniperWorker),
            dependencyContainer.resolve(CMCWorker),
            dependencyContainer.resolve(CoinLoreWorker),
            dependencyContainer.resolve(CoinScopeWorker),
            dependencyContainer.resolve(AdvnWorker),
            dependencyContainer.resolve(BitQueryWorker),
            dependencyContainer.resolve(CoinBrainWorker),
            dependencyContainer.resolve(CoinBuddyWorker),
            dependencyContainer.resolve(CoinCapWorker),
            dependencyContainer.resolve(CoinCatapultWorker),
            dependencyContainer.resolve(CoinCodexWorker),
            dependencyContainer.resolve(CoinDiscoveryWorker),
            dependencyContainer.resolve(CoinGeckoWorker),
            dependencyContainer.resolve(MyEtherListsWorker),
            dependencyContainer.resolve(RecentTokensWorker),
            dependencyContainer.resolve(RugFreeCoinsWorker),
            dependencyContainer.resolve(TokensInsightWorker),
            dependencyContainer.resolve(Top100TokensWorker),
            dependencyContainer.resolve(MailerService),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunTelegramWorker(
            dependencyContainer.resolve(TelegramWorker),
            dependencyContainer.resolve(MailerService),
            telegramLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunTwitterWorker(
            dependencyContainer.resolve(TwitterWorker),
            dependencyContainer.resolve(MailerService),
            twitterLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunDailyStatisticMailWorker(
            dependencyContainer.resolve(DailyStatisticMailWorker),
            dependencyContainer.resolve(MailerService),
            dailyStatisticMailLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCMCCommentsWorker(
            dependencyContainer.resolve(CoinMarketCommentWorker),
            dependencyContainer.resolve(MailerService),
            dailyStatisticMailLogger,
        )
    ),
})

// General

container.register(Application, {
    useFactory: instanceCachingFactory(() => new Application()),
})

export { container }
