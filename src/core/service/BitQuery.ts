// @ts-nocheck
import {singleton} from "tsyringe"
import {AdvnService} from "../service/AdvnService";
import {TokensService} from "../service";
import {Crypto} from "../../../config/blockchains";

@singleton()
export class BitQuery {
    private readonly unsupportedBlockchain: Crypto[] = [
        Crypto.CRO,
    ]

    public constructor(
        private readonly advnService: AdvnService,
        private readonly tokenService: TokensService,
    ) {}

    public async run(currentBlockchain: Crypto): Promise<any> {
        console.log(`${BitQuery.name} started`)

        console.log('[BitQuery] Finished')
    }
}
