import { container, instanceCachingFactory } from 'tsyringe'
import {
    CMCService,
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
    EtherScanAddressTokensHoldingsWorker,
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
    CryptoVoteListWorker,
    NewestCheckedTokenService,
    NewestCheckedTokenRepository,
    EthplorerWorker,
    GemFinderWorker,
    MemeCoinsWorker,
    MyCoinVoteWorker,
    MobulaWorker,
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
} from '../../core'
import { Application } from '../'
import { CliDependency } from './types'
import { getConnection } from 'typeorm'
import {
    RunEnqueueTokenWorker,
    RunQueueWorker,
    RunExplorerWorker,
    RunCoinGeckoWorker,
    RunAdvnWorker,
    RunCoinDiscoveryWorker,
    RunCoinBrainWorker,
    RunCoinBuddyWorker,
    RunCoinCapWorker,
    RunCoinCatapultWorker,
    RunCoinCodexWorker,
    RunBitQueryWorker,
    RunTelegramWorker,
    RunLastTokenTxDateFetcher,
    RunFetchTokenWorker,
    RunMailerWorker,
    RunRugFreeCoinsWorker,
    RunTop100TokensWorker,
    RunTokensInsightWorker,
    RunMyEtherListsWorker,
    RunRecentTokensWorker,
} from '../../command'
import { RetryAxios, TokenNamesGenerator, createLogger } from '../../utils'

// Loggers

const top100TokensLogger = createLogger(Top100TokensWorker.name.toLowerCase())
const tokensInsightLogger = createLogger(TokensInsightWorker.name.toLowerCase())
const rugFreeCoinsLogger = createLogger(RugFreeCoinsWorker.name.toLowerCase())
const recentTokensLogger = createLogger(RecentTokensWorker.name.toLowerCase())
const myEtherListsLogger = createLogger(MyEtherListsWorker.name.toLowerCase())
const cmcLogger = createLogger(CMCWorker.name.toLowerCase())
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
container.register(NewestCheckedTokenRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(NewestCheckedTokenRepository)),
})

// Utils

container.register(TokenNamesGenerator, {
    useFactory: instanceCachingFactory(() => new TokenNamesGenerator()),
})

// Services

container.register(CMCService, {
    useFactory: instanceCachingFactory(() => new CMCService()),
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
    )),
})

container.register(QueuedWalletAddressService, {
    useFactory: instanceCachingFactory((dependencyContainer) => new QueuedWalletAddressService(
        dependencyContainer.resolve(QueuedWalletAddressRepository),
        dependencyContainer.resolve(DuplicatesFoundService),
    )),
})

container.register(TokenNamesGenerator, {
    useFactory: instanceCachingFactory(() => new TokenNamesGenerator()),
})

container.register(RetryAxios, {
    useFactory: instanceCachingFactory(() => new RetryAxios()),
})

container.register(ContactMessageService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ContactMessageService(
            dependencyContainer.resolve(ContactMessageRepository),
        )
    ),
})

container.register(ContactQueueService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ContactQueueService(
            dependencyContainer.resolve(QueuedContactRepository),
        ),
    ),
})

container.register(ContactHistoryService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ContactHistoryService(
            dependencyContainer.resolve(ContactHistoryRepository),
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

// Workers

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(TokensService),
            cmcLogger,
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
            createLogger(BSCScanAddressTokensHoldingsWorker.name.toLowerCase())
        )
    ),
})

container.register(EtherScanAddressTokensHoldingsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new EtherScanAddressTokensHoldingsWorker(
            dependencyContainer.resolve(QueuedWalletAddressService),
            dependencyContainer.resolve(ExplorerEnqueuer),
            createLogger(EtherScanAddressTokensHoldingsWorker.name.toLowerCase())
        )
    ),
})

container.register(BSCScanTokensTransactionsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTokensTransactionsFetcher(
            dependencyContainer.resolve(ExplorerEnqueuer),
            createLogger(BSCScanTokensTransactionsFetcher.name.toLowerCase())
        )
    ),
})

container.register(BSCScanTopAccountsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTopAccountsFetcher(
            dependencyContainer.resolve(ExplorerEnqueuer),
            createLogger(BSCScanTopAccountsFetcher.name.toLowerCase())
        )
    ),
})

container.register(BSCScanTopTokensFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTopTokensFetcher(
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
            advnLogger,
        )
    ),
})

container.register(CoinDiscoveryWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinDiscoveryWorker(
            dependencyContainer.resolve(CoinDiscoveryService),
            dependencyContainer.resolve(TokensService),
            coinDiscoveryLogger,
        )
    ),
})

container.register(CoinBrainWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinBrainWorker(
            dependencyContainer.resolve(CoinBrainService),
            dependencyContainer.resolve(TokensService),
            coinBrainLogger,
        )
    ),
})

container.register(CoinBuddyWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinBuddyWorker(
            dependencyContainer.resolve(CoinBuddyService),
            dependencyContainer.resolve(TokensService),
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
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
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
            coinCatapultLogger,
        )
    ),
})

container.register(CoinCodexWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinCodexWorker(
            dependencyContainer.resolve(CoinCodexService),
            dependencyContainer.resolve(TokensService),
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
            tokensInsightLogger,
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

container.register(MailerWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MailerWorker(
            dependencyContainer.resolve(ContactQueueService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(ContactMessageService),
            dependencyContainer.resolve(ContactHistoryService),
            dependencyContainer.resolve(EnqueueTokensWorker),
            dependencyContainer.resolve(MailerService),
            mailerLogger,
        )
    ),
})

// CLI

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunTelegramWorker(
            dependencyContainer.resolve(TelegramWorker),
            telegramLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunEnqueueTokenWorker(
            dependencyContainer.resolve(EnqueueTokensWorker),
            enqueueTokenLogger
        ),
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunQueueWorker(
            dependencyContainer.resolve(QueueWorker),
            queueLogger,
        ),
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunExplorerWorker(
            dependencyContainer.resolve(BSCScanAddressTokensHoldingsWorker),
            dependencyContainer.resolve(EtherScanAddressTokensHoldingsWorker),
            dependencyContainer.resolve(BSCScanTokensTransactionsFetcher),
            dependencyContainer.resolve(BSCScanTopAccountsFetcher),
            dependencyContainer.resolve(BSCScanTopTokensFetcher),
            dependencyContainer.resolve(BSCScanValidatorsFetcher),
            dependencyContainer.resolve(CheckTokenBNBWorker),
            dependencyContainer.resolve(ExplorerSearchAPIWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinGeckoWorker(
            dependencyContainer.resolve(CoinGeckoWorker),
            coinGeckoLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunAdvnWorker(
            dependencyContainer.resolve(AdvnWorker),
            advnLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinDiscoveryWorker(
            dependencyContainer.resolve(CoinDiscoveryWorker),
            coinDiscoveryLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinBrainWorker(
            dependencyContainer.resolve(CoinBrainWorker),
            coinBrainLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinBuddyWorker(
            dependencyContainer.resolve(CoinBuddyWorker),
            coinBuddyLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinCapWorker(
            dependencyContainer.resolve(CoinCapWorker),
            coinCapLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinCatapultWorker(
            dependencyContainer.resolve(CoinCatapultWorker),
            coinCatapultLogger,
        ),
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunRugFreeCoinsWorker(
            dependencyContainer.resolve(RugFreeCoinsWorker),
            rugFreeCoinsLogger,
        ),
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunTop100TokensWorker(
            dependencyContainer.resolve(Top100TokensWorker),
            top100TokensLogger,
        ),
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinCodexWorker(
            dependencyContainer.resolve(CoinCodexWorker),
            coinCodexLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunBitQueryWorker(
            dependencyContainer.resolve(BitQueryWorker),
            bitQueryLogger
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunMailerWorker(
            dependencyContainer.resolve(MailerWorker),
            mailerLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunRecentTokensWorker(
            dependencyContainer.resolve(RecentTokensWorker),
            recentTokensLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunLastTokenTxDateFetcher(
            dependencyContainer.resolve(LastTokenTxDateFetcher),
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
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunTelegramWorker(
            dependencyContainer.resolve(TelegramWorker),
            telegramLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunTokensInsightWorker(
            dependencyContainer.resolve(TokensInsightWorker),
            tokensInsightLogger,
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunMyEtherListsWorker(
            dependencyContainer.resolve(MyEtherListsWorker),
            myEtherListsLogger,
        )
    ),
})

// General

container.register(Application, {
    useFactory: instanceCachingFactory(() => new Application()),
})

export { container }
