import { singleton } from "tsyringe"
import { CMCWorker, CoinLoreWorker, CoinScopeWorker } from "../core"
import { Blockchain } from "../utils"

@singleton()
export class Application {

    public constructor(
        private cmcWorker: CMCWorker,
        private coinLoreWorker: CoinLoreWorker,
        private coinScopeWorker: CoinScopeWorker,
    ) {}

    public run(): void {
        // this.cmcWorker.run(Blockchain.BSC)
        // this.coinLoreWorker.run()

        this.coinScopeWorker.run(Blockchain.BSC)
    }
}
