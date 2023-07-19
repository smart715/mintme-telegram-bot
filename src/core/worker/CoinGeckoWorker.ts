// @ts-nocheck
import {singleton} from "tsyringe"
import {AbstractTokenWorker} from "./AbstractTokenWorker";

@singleton()
export class CoinGeckoWorker extends AbstractTokenWorker {
    public constructor() {
        super()
    }

    public async run(currentBlockchain: Crypto): Promise<any> {
        console.log(`${CoinGeckoWorker.name} started`)


        console.log(`${CoinGeckoWorker.name} finished`)
    }
}
