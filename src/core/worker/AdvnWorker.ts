import { singleton } from "tsyringe"
import { AbstractTokenWorker } from "./AbstractTokenWorker"

@singleton()
export class AdvnWorker extends AbstractTokenWorker {
    public constructor() {
        super()
    }

    public async run(): Promise<any> {}
}
