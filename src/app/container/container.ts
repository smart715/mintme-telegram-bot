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
} from '../../command'
import { RetryAxios, TokenNamesGenerator } from '../../utils'

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

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(TokensService),
        ),
    ),
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

container.register(ContactHistoryService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ContactHistoryService(
            dependencyContainer.resolve(ContactHistoryRepository)
        )
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

// Workers

container.register(ExplorerEnqueuer, {
    useFactory: instanceCachingFactory((dependencyContainer) => new ExplorerEnqueuer(
        dependencyContainer.resolve(QueuedTokenAddressService),
        dependencyContainer.resolve(QueuedWalletAddressService),
    )),
})

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(TokensService),
        ),
    ),
})

container.register(EnqueueTokensWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new EnqueueTokensWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(MintmeService),
            dependencyContainer.resolve(ContactHistoryService),
            dependencyContainer.resolve(ContactQueueService),
        ),
    ),
})

container.register(CoinGeckoWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinGeckoWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(CoinGeckoService)
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
        ),
    ),
})

container.register(BSCScanAddressTokensHoldingsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanAddressTokensHoldingsWorker(
            dependencyContainer.resolve(QueuedWalletAddressService),
            dependencyContainer.resolve(ExplorerEnqueuer),
        )
    ),
})

container.register(EtherScanAddressTokensHoldingsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new EtherScanAddressTokensHoldingsWorker(
            dependencyContainer.resolve(QueuedWalletAddressService),
            dependencyContainer.resolve(ExplorerEnqueuer),
        )
    ),
})

container.register(BSCScanTokensTransactionsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTokensTransactionsFetcher(
            dependencyContainer.resolve(ExplorerEnqueuer),
        )
    ),
})

container.register(BSCScanTokensTransactionsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTokensTransactionsFetcher(
            dependencyContainer.resolve(ExplorerEnqueuer),
        )
    ),
})

container.register(BSCScanTopAccountsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTopAccountsFetcher(
            dependencyContainer.resolve(ExplorerEnqueuer),
        )
    ),
})

container.register(BSCScanTopTokensFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanTopTokensFetcher(
            dependencyContainer.resolve(ExplorerEnqueuer),
        )
    ),
})

container.register(BSCScanValidatorsFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BSCScanValidatorsFetcher(
            dependencyContainer.resolve(ExplorerEnqueuer),
        )
    ),
})

container.register(CheckTokenBNBWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CheckTokenBNBWorker(
            dependencyContainer.resolve(QueuedTokenAddressService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(ExplorerSearchAPIWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ExplorerSearchAPIWorker(
            dependencyContainer.resolve(TokenNamesGenerator),
            dependencyContainer.resolve(LastCheckedTokenNameService),
            dependencyContainer.resolve(ExplorerEnqueuer),
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
        )
    ),
})

container.register(LastTokenTxDateFetcher, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new LastTokenTxDateFetcher(
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(AdvnWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new AdvnWorker(
            dependencyContainer.resolve(AdvnService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(CoinDiscoveryWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinDiscoveryWorker(
            dependencyContainer.resolve(CoinDiscoveryService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(CoinBrainWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinBrainWorker(
            dependencyContainer.resolve(CoinBrainService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(CoinBuddyWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinBuddyWorker(
            dependencyContainer.resolve(CoinBuddyService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(CoinCapWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinCapWorker(
            dependencyContainer.resolve(CoinCapService),
            dependencyContainer.resolve(QueuedTokenAddressService),
        )
    ),
})

container.register(CryptoVoteListWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CryptoVoteListWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(RetryAxios),
        )
    ),
})

container.register(EthplorerWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new EthplorerWorker(
            dependencyContainer.resolve(TokenNamesGenerator),
            dependencyContainer.resolve(LastCheckedTokenNameService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(GemFinderWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new GemFinderWorker(
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
        )
    ),
})

container.register(MemeCoinsWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MemeCoinsWorker(
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
        )
    ),
})

container.register(MobulaWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MobulaWorker(
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
        )
    ),
})

container.register(MyCoinVoteWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new MyCoinVoteWorker(
            dependencyContainer.resolve(NewestCheckedTokenService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(RetryAxios),
        )
    ),
})

container.register(Application, {
    useFactory: instanceCachingFactory(() => new Application()),
})

container.register(CoinCatapultWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinCatapultWorker(
            dependencyContainer.resolve(CoinCatapultService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(CoinCodexWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinCodexWorker(
            dependencyContainer.resolve(CoinCodexService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

container.register(BitQueryWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new BitQueryWorker(
            dependencyContainer.resolve(BitQueryService),
            dependencyContainer.resolve(QueuedTokenAddressService),
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
        )
    ),
})

// CLI

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunTelegramWorker(
            dependencyContainer.resolve(TelegramWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunEnqueueTokenWorker(
            dependencyContainer.resolve(EnqueueTokensWorker),
        ),
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunQueueWorker(
            dependencyContainer.resolve(QueueWorker),
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
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunAdvnWorker(
            dependencyContainer.resolve(AdvnWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinDiscoveryWorker(
            dependencyContainer.resolve(CoinDiscoveryWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinBrainWorker(
            dependencyContainer.resolve(CoinBrainWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinBuddyWorker(
            dependencyContainer.resolve(CoinBuddyWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinCapWorker(
            dependencyContainer.resolve(CoinCapWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinCatapultWorker(
            dependencyContainer.resolve(CoinCatapultWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunCoinCodexWorker(
            dependencyContainer.resolve(CoinCodexWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunBitQueryWorker(
            dependencyContainer.resolve(BitQueryWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunMailerWorker(
            dependencyContainer.resolve(MailerWorker),
        )
    ),
})

container.register(CliDependency.COMMAND, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new RunLastTokenTxDateFetcher(
            dependencyContainer.resolve(LastTokenTxDateFetcher),
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

// General

container.register(Application, {
    useFactory: instanceCachingFactory(() => new Application()),
})

export { container }
