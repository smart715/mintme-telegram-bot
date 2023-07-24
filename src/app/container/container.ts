import { container, instanceCachingFactory } from 'tsyringe'
import { CMCService, CMCWorker, ChannelStatusRepository, ChannelStatusService, ContactHistoryRepository, ContactHistoryService, ContactMessageRepository, ContactQueueService, EnqueueTokensWorker, MintmeService, QueueWorker, QueuedContactRepository, SeleniumService, TokenRepository, TokensService } from '../../core'
import { Application } from '../'
import { CliDependency } from './types'
import { getConnection } from 'typeorm'
import { RunEnqueueTokenWorker, RunQueueWorker } from '../../command'

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

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(TokensService),
        ),
    ),
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

export { container }
