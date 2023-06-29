import { singleton } from "tsyringe"
import { AbstractTokenWorker } from "./AbstractTokenWorker"
import {AdvnService} from "../service/AdvnService";

@singleton()
export class AdvnWorker extends AbstractTokenWorker {

    public constructor(
        private readonly advnService: AdvnService,
    ) {
        super()
    }

    public async run(): Promise<any> {
        console.log(`${AdvnWorker.name} started`)

        // let count = 3000
        // let start = 0
        // do {
        //
        // } while (count > 0)

        await this.advnService.getTokens(0)
    }
}
