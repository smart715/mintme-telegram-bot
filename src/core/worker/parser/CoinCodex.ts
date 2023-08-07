import {AbstractTokenWorker} from "../AbstractTokenWorker";
import {singleton} from "tsyringe";
import {Blockchain} from "../../../utils";

@singleton()
export class CoinCodex extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinCodex]'
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public async run(): Promise<void> {

    }
}
