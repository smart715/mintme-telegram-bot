import { container, instanceCachingFactory } from "tsyringe";
import { CMCService, CMCWorker } from "../../core";
import { Application } from "../";

container.register(CMCService, {
    useFactory: instanceCachingFactory(() => new CMCService()),
})

container.register(CMCWorker, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new CMCWorker(dependencyContainer.resolve(CMCService))
    )
})

container.register(Application, {
    useFactory: instanceCachingFactory((dependencyContainer) =>
        new Application(dependencyContainer.resolve(CMCWorker))
    )
})

export { container }
