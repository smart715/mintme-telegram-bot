import { container, instanceCachingFactory } from "tsyringe"
import { CMCService, CMCWorker, TokensService, SeleniumService } from "../../core"
import { Application } from "../"
import { BnbTokensRepository, CroTokensRepository, EtherscanTokensRepository } from "../../core/repository"
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

container.register(CMCService, {
    useFactory: instanceCachingFactory(() => new CMCService()),
})

container.register(TokensService, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new TokensService(
            dependencyContainer.resolve(BnbTokensRepository),
            dependencyContainer.resolve(EtherscanTokensRepository),
            dependencyContainer.resolve(CroTokensRepository),
        )
    )
})

container.register(SeleniumService, {
    useFactory: instanceCachingFactory(() => new SeleniumService()),
})

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(TokensService),
        )
    )
})

container.register(Application, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new Application(dependencyContainer.resolve(CMCWorker))
    )
})

export { container }
