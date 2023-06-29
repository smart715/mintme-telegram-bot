import { singleton } from "tsyringe"
import { CMCWorker, CoinLoreWorker } from "../core"

@singleton()
export class Application {

    public constructor(
        private cmcWorker: CMCWorker,
        private coinLoreWorker: CoinLoreWorker,
    ) {}

    public run(): void {
        //this.cmcWorker.run()
        this.coinLoreWorker.run()
    }
}
