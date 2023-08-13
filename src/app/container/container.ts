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
} from '../../core'
import { Application } from '../'
import { CliDependency } from './types'
import { getConnection } from 'typeorm'
import { RunEnqueueTokenWorker, RunQueueWorker, RunExplorerWorker, RunTelegramWorker } from '../../command'
import { TokenNamesGenerator } from '../../utils'

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

container.register(CMCService, {
    useFactory: instanceCachingFactory(() => new CMCService()),
})

container.register(MintmeService, {
    useFactory: instanceCachingFactory(() => new MintmeService()),
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

container.register(ExplorerEnqueuer, {
    useFactory: instanceCachingFactory((dependencyContainer) => new ExplorerEnqueuer(
        dependencyContainer.resolve(QueuedTokenAddressService),
        dependencyContainer.resolve(QueuedWalletAddressService),
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

container.register(Application, {
    useFactory: instanceCachingFactory(() => new Application()),
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
        new RunTelegramWorker(
            dependencyContainer.resolve(TelegramWorker),
        )
    ),
})

export { container }
