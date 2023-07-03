// @ts-nocheck
import {singleton} from "tsyringe"
import {AbstractTokenWorker} from "./AbstractTokenWorker"
import {AdvnService} from "../service/AdvnService";
import {findContractAddress, getHrefFromTagString, getHrefValuesFromTagString} from "../../utils";
import {TokensService} from "../service";
import {Crypto} from "../../../config/blockchains";

@singleton()
export class AdvnWorker extends AbstractTokenWorker {
    private readonly unsupportedBlockchain: Crypto[] = [
        Crypto.CRO,
    ]

    public constructor(
        private readonly advnService: AdvnService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Crypto): Promise<any> {
        console.log(`${AdvnWorker.name} started`)

        if (this.unsupportedBlockchain.includes(currentBlockchain)) {
            console.log(`[AdvnWorker] Unsupported blockchain: ${currentBlockchain}`)

            return
        }

        const target = Crypto.BNB === currentBlockchain
            ? "Binance"
            : "Ethereum"

        let count = 3000
        let start = 0
        do {
            console.log(`[ADVN] Page start ${start}`)

            const tokens = await this.advnService.getTokens(start)

            for (const advnToken of tokens.data) {
                if (!advnToken.platform?.toString().includes(target)) {
                    continue;
                }

                const nameSymbolArr = advnToken.name_symbol;
                const name = nameSymbolArr[0] + "(" + nameSymbolArr[nameSymbolArr.length - 1] + ")"
                const id = name.replace(" ", "-").replace("(", "-").replace(")", "")
                const tokenInfo = await this.advnService.getTokenInfo(id);

                const tokenAddress = findContractAddress(tokenInfo);

                if (!tokenAddress || !tokenAddress.startsWith("0x")) {
                    continue
                }

                const website = getHrefFromTagString(
                    tokenInfo.match(/<tr title="Official Website(.+?)<\/td>(.+?)<\/tr>/).join(' ')
                )

                const links = getHrefValuesFromTagString(
                    tokenInfo.match(/<table class=\"table table-hover fundamentals social\">(.+?)<\/table>/).join(' ')
                );

                await this.tokenService.add(
                    tokenAddress,
                    name,
                    website,
                    "",
                    links.join('\n'),
                    "ADVN",
                    currentBlockchain,
                )
            }

            count = tokens.data.length
            start += 3000
        } while (count > 0)

        console.log('[ADVN] Finished')
    }
}
