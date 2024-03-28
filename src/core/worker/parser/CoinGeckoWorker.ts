import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CheckedTokenService, CoinGeckoService, TokensService } from '../../service'
import { Blockchain, parseBlockchainName, sleep } from '../../../utils'
import { AllCoinsTokenResponse, CoinInfo, LinksCoinInfo } from '../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinGeckoWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinGecko'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly sleepDuration = 20 * 1000

    public constructor(
        private readonly tokenService: TokensService,
        private readonly coinGeckoService: CoinGeckoService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        let tokens: AllCoinsTokenResponse[]

        try {
            tokens = await this.coinGeckoService.getAll('https://api.coingecko.com/api/v3/coins/list?include_platform=true')
        } catch (ex: any) {
            this.logger.error(
                `${this.prefixLog} Aborting. Failed to fetch all tokens. Reason: ${ex.message}`
            )

            return
        }

        for (const token of tokens) {
            const tokenId: string = token.id
            if (tokenId.length <= 0 || tokenId.startsWith('realt-')) {
                continue
            }

            if (await this.checkedTokenService.isChecked(tokenId, this.workerName)) {
                this.logger.warn(`${this.prefixLog} ${tokenId} already checked. Skipping`)

                continue
            }

            let address: string = ''
            let blockchain: Blockchain|undefined

            const platforms = Object.keys(token.platforms)

            for (const platform of platforms) {
                try {
                    blockchain = parseBlockchainName(platform)
                    address = token.platforms[platform]
                    break
                } catch (err) {
                    continue
                }
            }

            if (!address.length || !blockchain) {
                continue
            }

            let coinInfo: CoinInfo

            await sleep(this.sleepDuration)

            this.logger.info(`Checking token ${token.name}`)

            try {
                coinInfo = await this.coinGeckoService.getCoinInfo(tokenId)
                await this.checkedTokenService.saveAsChecked(tokenId, this.workerName)
            } catch (ex: any) {
                if (ex.message.includes('code 404')) {
                    await this.checkedTokenService.saveAsChecked(tokenId, this.workerName)
                }

                this.logger.warn(
                    `Failed to fetch coin info for ${tokenId} tokenId. Reason ${ex.message}. Skipping...`
                )

                continue
            }

            const coinName: string = coinInfo.name + '(' + coinInfo.symbol + ')'
            const links = coinInfo.links

            const websites: string[] = links.homepage.filter((page) => page !== '')

            if (
                websites.includes('realt.co') ||
                coinName.toLowerCase().includes('x short') ||
                coinName.toLowerCase().includes('x long') ||
                coinName.startsWith('Aave ')
            ) {
                continue
            }

            const allLinks = this.getLinks(links)

            await this.tokenService.addOrUpdateToken(
                address,
                coinName,
                websites,
                [ '' ],
                allLinks,
                this.workerName,
                blockchain,
                this.logger
            )

            this.logger.info(
                `${this.prefixLog} Added to DB:`,
                [
                    address,
                    coinName,
                    websites,
                    allLinks,
                    this.workerName,
                    blockchain,
                ]
            )
        }

        this.logger.info(`${this.prefixLog} Worker finished`)
    }

    private getLinks(links: LinksCoinInfo): string[] {
        const otherLinks: string[] = []

        if (links.twitter_screen_name !== null && links.twitter_screen_name.length > 0) {
            otherLinks.push('https://twitter.com/' + links.twitter_screen_name)
        }

        if (links.facebook_username !== null && links.facebook_username.length > 0) {
            otherLinks.push('https://facebook.com/' + links.facebook_username)
        }

        if (links.telegram_channel_identifier !== null && links.telegram_channel_identifier.length > 0) {
            otherLinks.push('https://t.me/' + links.telegram_channel_identifier)
        }

        if (links.subreddit_url !== null && links.subreddit_url.length > 0) {
            otherLinks.push(links.subreddit_url)
        }

        if (links.chat_url.length > 0) {
            otherLinks.concat(links.chat_url)
        }

        return otherLinks.filter((link) => link !== '')
    }
}
