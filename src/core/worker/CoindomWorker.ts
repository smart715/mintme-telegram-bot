import { singleton } from "tsyringe";
import { AbstractTokenWorker } from "./AbstractTokenWorker";

@singleton()
export class CoindomWorker extends AbstractTokenWorker {
    // doesnt work
}
