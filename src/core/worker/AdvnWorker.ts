// @ts-nocheck
import {singleton} from "tsyringe"
import {AbstractTokenWorker} from "./AbstractTokenWorker"
import {AdvnService} from "../service/AdvnService";
import {Blockchain, findContractAddress, getHrefFromTagString, getHrefValuesFromTagString, logger} from "../../utils";
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

    public async run(currentBlockchain: Blockchain): Promise<any> {
        logger.info(`${AdvnWorker.name} started`)

        if (this.unsupportedBlockchain.includes(currentBlockchain)) {
            logger.info(`[AdvnWorker] Unsupported blockchain: ${currentBlockchain}`)

            return
        }

        const target = Crypto.BNB === currentBlockchain
            ? "Binance"
            : "Ethereum"

        let count = 3000
        let start = 0
        do {
            logger.info(`[ADVN] Page start ${start}`)

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

        logger.info('[ADVN] Finished')
    }
}
