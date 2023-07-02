import { container, instanceCachingFactory } from "tsyringe"
import { CMCService, CMCWorker, CoinLoreService, CoinLoreWorker, CoinScopeService, CoinScopeWorker, TokenCachedDataService, TokensService } from "../../core"
import { Application } from "../"
import { BnbTokensRepository, CroTokensRepository, EtherscanTokensRepository, TokenCachedDataRepository } from "../../core/repository"
import { getConnection } from "typeorm"

container.register(BnbTokensRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(BnbTokensRepository)),
})

container.register(EtherscanTokensRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(EtherscanTokensRepository)),
})

container.register(CroTokensRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(CroTokensRepository)),
})

container.register(TokenCachedDataRepository, {
    useFactory: instanceCachingFactory(() => getConnection().getCustomRepository(TokenCachedDataRepository)),
})

container.register(CMCService, {
    useFactory: instanceCachingFactory(() => new CMCService()),
})

container.register(CoinLoreService, {
    useFactory: instanceCachingFactory(() => new CoinLoreService()),
})

container.register(CoinScopeService, {
    useFactory: instanceCachingFactory(() => new CoinScopeService()),
})

container.register(TokenCachedDataService, {
    useFactory: instanceCachingFactory((dependencyContainer) => 
        new TokenCachedDataService(
            dependencyContainer.resolve(TokenCachedDataRepository)
        ),
    )
})

container.register(TokensService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new TokensService(
            dependencyContainer.resolve(BnbTokensRepository),
            dependencyContainer.resolve(EtherscanTokensRepository),
            dependencyContainer.resolve(CroTokensRepository),
        ),
    )
})

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(TokensService),
        ),
    )
})

container.register(CoinLoreWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinLoreWorker(
            dependencyContainer.resolve(CoinLoreService),
            dependencyContainer.resolve(TokensService),
        ),
    )
})

container.register(CoinScopeWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CoinScopeWorker(
            dependencyContainer.resolve(CoinScopeService),
            dependencyContainer.resolve(TokensService),
            dependencyContainer.resolve(TokenCachedDataService),
        ),
    )
})

container.register(Application, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new Application(
            dependencyContainer.resolve(CMCWorker),
            dependencyContainer.resolve(CoinLoreWorker),
            dependencyContainer.resolve(CoinScopeWorker),
        ),
    )
})

export { container }
