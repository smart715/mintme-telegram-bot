import { singleton } from "tsyringe"
import { CMCWorker } from "../core"
import { AdvnWorker } from "../core/worker/AdvnWorker";
import { Crypto } from "../../config/blockchains";

@singleton()
export class Application {

    public constructor(
        private cmcWorker: CMCWorker,
        private advnWorker: AdvnWorker,
    ) {}

    public async run(): Promise<void> {
        this.cmcWorker.run()

        this.advnWorker.run(Crypto.BNB)
        this.advnWorker.run(Crypto.ETH)
    }
}
