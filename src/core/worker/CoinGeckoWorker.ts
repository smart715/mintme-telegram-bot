// @ts-nocheck
import {singleton} from "tsyringe"
import {AbstractTokenWorker} from "./AbstractTokenWorker";
import {TokensService} from "../service";
import {Blockchain} from "../../utils";
import {CoinGeckoService} from "../service/CoinGeckoService";

@singleton()
export class CoinGeckoWorker extends AbstractTokenWorker {
    public constructor(
        private readonly tokenService: TokensService,
        private readonly coinGeckoService: CoinGeckoService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<any> {
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

            const response = await this.coinGeckoService.getAll(link)
            const tokens = response.tokens

            for (const token of tokens) {
                const tokenId: string = token.name.toString().replace(" ", "-")

                if (tokenId.length <= 0 || tokenId.startsWith("realt-")) {
                    continue
                }

                const bscAddress: string = token.address.toString()

                if (bscAddress < 0) {
                    continue
                }

                const coinInfo = await this.coinGeckoService.getCoinInfo(tokenId)

                if ("" === coinInfo) {
                    continue
                }

                const coinName: string = coinInfo.name + "(" + coinInfo.symbol + ")"
                const links = coinInfo.links

                const website: string = links.homepage

                if (
                    website.includes("realt.co") ||
                    coinName.toLowerCase().includes("x short") ||
                    coinName.toLowerCase().includes("x long") ||
                    coinName.startsWith("Aave ")
                ) {
                    continue
                }

                let otherLinks = []

                if (links.twitter_screen_name.length > 0) {
                    otherLinks.push("https://twitter.com/" + links.twitter_screen_name)
                }

                if (links.facebook_username.length > 0) {
                    otherLinks.push("https://facebook.com/" + links.facebook_username)
                }

                if (links.telegram_channel_identifier.length > 0) {
                    otherLinks.push("https://t.me/" + links.telegram_channel_identifier)
                }

                if (links.subreddit_url.length > 0) {
                    otherLinks.push(links.subreddit_url.toString())
                }

                const allLinks: string[] = otherLinks.concat(links.chat_url)

                await this.tokenService.add(
                    bscAddress,
                    coinName,
                    [website],
                    [''],
                    allLinks,
                    'CoinGecko',
                    currentBlockchain
                )

                console.log('Added to DB: ', bscAddress, coinName, website, '', links.join(','), 'CoinGecko', currentBlockchain)
            }

            console.log(`${CoinGeckoWorker.name} finished`)
        } catch (error: any) {
            console.log(`${CoinGeckoWorker.name} something went wrong. Reason: ${error.message}`)
        }

    }
}
