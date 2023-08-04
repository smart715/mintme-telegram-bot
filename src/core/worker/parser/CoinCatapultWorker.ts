import {AbstractTokenWorker} from "../AbstractTokenWorker";
import {Blockchain} from "../../../utils";

export class CoinCatapultWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinCatapult]'
    private readonly unsupportedBlockchain: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
    ) {
        super();
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {

    }
}
