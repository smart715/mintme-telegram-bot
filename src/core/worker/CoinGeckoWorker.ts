// @ts-nocheck
import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from './AbstractTokenWorker'
import { TokensService } from '../service'
import {Blockchain, logger, sleep} from '../../utils'
import { CoinGeckoService } from '../service'

@singleton()
export class CoinGeckoWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[CoinGecko]'
    private readonly sleepDuration = 4 * 1000 // 3 seconds produces 429 http error. So 4-5 is ok

    public constructor(
        private readonly tokenService: TokensService,
        private readonly coinGeckoService: CoinGeckoService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<any> {
        logger.info(`${CoinGeckoWorker.name} started`)

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

        let tokens = {}

        try {
            const response = await this.coinGeckoService.getAll(link)
            tokens = response.tokens
        } catch (ex) {
            logger.error(
                `${this.prefixLog} Aborting. Failed to fetch all tokens. Link: ${link} Reason: ${ex.message}`
            )

            return
        }

        for (const token of tokens) {
            const tokenId: string = token.name.toString().toLowerCase().replace(" ", "-")

            if (tokenId.length <= 0 || tokenId.startsWith("realt-")) {
                continue
            }

            const address: string = token.address.toString()

            if (address < 0) {
                continue
            }

            let coinInfo = {}

            await sleep(this.sleepDuration)

            try {
                coinInfo = await this.coinGeckoService.getCoinInfo(tokenId)
            } catch (e) {
                logger.warn(
                    `Failed to fetch coin info for ${tokenId} tokenId. Reason ${e.message}. Skipping...`
                )

                continue
            }

            logger.info(tokenId)

            const coinName: string = coinInfo.name + "(" + coinInfo.symbol + ")"
            const links = coinInfo.links

            const website: string[] = links.homepage

            if (
                website.includes("realt.co") ||
                coinName.toLowerCase().includes("x short") ||
                coinName.toLowerCase().includes("x long") ||
                coinName.startsWith("Aave ")
            ) {
                continue
            }

            const allLinks = this.getLinks(links)

            const tokenInDb = await this.tokenService.findByAddress(address, currentBlockchain)

            if (tokenInDb) {
                continue
            }

            await this.tokenService.add(address, coinName, website, [''], allLinks, 'CoinGecko', currentBlockchain)

            logger.info('Added to DB: ', address, coinName, website, '', allLinks, 'CoinGecko', currentBlockchain)
        }

        logger.info(`${CoinGeckoWorker.name} finished`)
    }
    private getLinks(links: object): string[]
    {
        let otherLinks = []

        if (links.twitter_screen_name !== null && links.twitter_screen_name.length > 0) {
            otherLinks.push("https://twitter.com/" + links.twitter_screen_name)
        }

        if (links.facebook_username !== null && links.facebook_username.length > 0) {
            otherLinks.push("https://facebook.com/" + links.facebook_username)
        }

        if (links.telegram_channel_identifier !== links && links.telegram_channel_identifier.length > 0) {
            otherLinks.push("https://t.me/" + links.telegram_channel_identifier)
        }

        if (links.subreddit_url !== null && links.subreddit_url.length > 0) {
            otherLinks.push(links.subreddit_url)
        }

        if (links.subreddit_url !== null && links.subreddit_url.length > 0) {
            otherLinks.push(links.subreddit_url)
        }

        if (links.chat_url !== null && links.chat_url.length > 0) {
            otherLinks.push(links.chat_url)
        }


        return otherLinks
    }
}
