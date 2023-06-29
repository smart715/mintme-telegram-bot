import { container, instanceCachingFactory } from "tsyringe"
import { CMCService, CMCWorker, TokensService } from "../../core"
import { Application } from "../"
import { BnbTokensRepository, CroTokensRepository, EtherscanTokensRepository } from "../../core/repository"
import { getConnection } from "typeorm"
import {AdvnWorker} from "../../core/worker/AdvnWorker";
import {AdvnService} from "../../core/service/AdvnService";

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

container.register(AdvnService, {
    useFactory: instanceCachingFactory(() => new AdvnService()),
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

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(
            dependencyContainer.resolve(CMCService),
            dependencyContainer.resolve(TokensService),
        )
    )
})

container.register(AdvnWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new AdvnWorker(
            dependencyContainer.resolve(AdvnService),
        )
    )
})

container.register(Application, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new Application(
            dependencyContainer.resolve(CMCWorker),
            dependencyContainer.resolve(AdvnWorker),
        )
    )
})

export { container }
