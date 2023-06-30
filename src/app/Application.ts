import { singleton } from "tsyringe"
import { CMCWorker, CoinLoreWorker } from "../core"
import { Blockchain } from "../utils"

@singleton()
export class Application {

    public constructor(
        private cmcWorker: CMCWorker,
        private coinLoreWorker: CoinLoreWorker,
    ) {}

    public run(): void {
        this.cmcWorker.run(Blockchain.BSC)
        //this.coinLoreWorker.run()
    }
}
