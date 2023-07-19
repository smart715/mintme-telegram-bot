// @ts-nocheck
import {singleton} from "tsyringe"
import {AbstractTokenWorker} from "./AbstractTokenWorker";
import axios from "axios";

@singleton()
export class CoinGeckoWorker extends AbstractTokenWorker {
    public constructor() {
        super()
    }

    public async run(currentBlockchain: Crypto): Promise<any> {
        try {
            console.log(`${CoinGeckoWorker.name} started`)

            let link: string = ''

            switch (currentBlockchain) {
                case "BSC":
                    link = "https://tokens.coingecko.com/binance-smart-chain/all.json"

                    break
                case "ETH":
                    link = "https://tokens.coingecko.com/ethereum/all.json"

                    break
                case "CRO":
                    link = "https://tokens.coingecko.com/cronos/all.json"

                    break
            }

            const response = await axios.get(link)
            const data = response.data
            const tokens = data.tokens

            tokens.forEach((token: object) => {
                const tokenId: string = token.name.toString().replace(" ", "-")

                if (tokenId.length <= 0 || tokenId.startsWith("realt-")) {
                    return
                }

                const bscAddress: string = token.address.toString()

                if (bscAddress < 0) {
                    return
                }
            })

            console.log(`${CoinGeckoWorker.name} finished`)
        } catch (error: any) {
            console.log(`${CoinGeckoWorker.name} something went wrong. Reason: ${error.message}`)
        }

    }
}
