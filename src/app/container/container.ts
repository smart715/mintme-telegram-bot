import { container, instanceCachingFactory } from 'tsyringe'
import {
    CMCService,
    CMCWorker,
    ChannelStatusService,
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
    ChannelStatusRepository,
    ContactHistoryRepository,
    ContactMessageRepository,
    DuplicatesFoundRepository,
    LastCheckedTokenNameRepository,
    QueuedContactRepository,
    QueuedTokenAddressRepository,
    QueuedWalletAddressRepository,
    TokenRepository,
    CoinGeckoService,
    CoinGeckoWorker,
    AdvnWorker,
    AdvnService,
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
} from '../../command'
import { TokenNamesGenerator } from '../../utils'

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

container.register(ChannelStatusRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(ChannelStatusRepository)),
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

container.register(ChannelStatusService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new ChannelStatusService(
            dependencyContainer.resolve(ChannelStatusRepository),
        ),
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
            dependencyContainer.resolve(ChannelStatusService),
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
            dependencyContainer.resolve(ChannelStatusService),
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

container.register(AdvnWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new AdvnWorker(
            dependencyContainer.resolve(AdvnService),
            dependencyContainer.resolve(TokensService),
        )
    ),
})

// CLI

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

// General

container.register(Application, {
    useFactory: instanceCachingFactory(() => new Application()),
})

export { container }
