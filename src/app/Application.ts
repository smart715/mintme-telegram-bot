import { singleton } from "tsyringe"
import { CMCWorker } from "../core"
import {AdvnWorker} from "../core/worker/AdvnWorker";

@singleton()
export class Application {

    public constructor(
        private cmcWorker: CMCWorker,
        private advnWorker: AdvnWorker,
    ) {}

    public run(): void {
        this.cmcWorker.run()
        this.advnWorker.run()
    }
}
