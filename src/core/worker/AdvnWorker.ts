// @ts-nocheck
import { singleton } from "tsyringe"
import { AbstractTokenWorker } from "./AbstractTokenWorker"
import { AdvnService } from "../service/AdvnService";
import { findContractAddress } from "../../utils";

@singleton()
export class AdvnWorker extends AbstractTokenWorker {
    private readonly allowedBlockchains: string[] = [
        "BSC",
        "Binance",
        "Ethereum",
    ]

    public constructor(
        private readonly advnService: AdvnService,
    ) {
        super()
    }

    public async run(): Promise<any> {
        console.log(`${AdvnWorker.name} started`)

        let count = 3000
        let start = 0
        do {
            console.log(`[ADVN] Page start ${start}`)

            const tokens = await this.advnService.getTokens(start)

            for (const advnToken of tokens.data) {
                if (!this.allowedBlockchains.includes(advnToken.platform?.toString())) {
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

                const parser = new DOMParser()
                const document = parser.parseFromString(tokenInfo, 'text/html')

                const trTags = document.body.getElementsByTagName('tr')
                const a = [...asd]

                a.f


                const website = tokenInfo.match('<tr title="Official Website(.+?)</td>(.+?)</tr>')

            }

            count = tokens.data.length
            start += 3000
        } while (count > 0)

    }
}
