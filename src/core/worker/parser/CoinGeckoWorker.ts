import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { CheckedTokenService, CoinGeckoService, TokensService } from '../../service'
import { Blockchain, sleep } from '../../../utils'
import { AllCoinsTokenResponse, CoinInfo, LinksCoinInfo } from '../../types'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinGeckoWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinGecko'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly sleepDuration = 4 * 1000 // 3 seconds produces 429 http error. So 4-5 is ok
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC, Blockchain.CRO ]

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

        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }

        this.logger.info(`${this.prefixLog} Worker finished`)
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} checking ${currentBlockchain} blockchain`)

        const link = this.getAllCoinsLink(currentBlockchain)

        let tokens: AllCoinsTokenResponse[]

        try {
            const response = await this.coinGeckoService.getAll(link)
            tokens = response.tokens
        } catch (ex: any) {
            this.logger.error(
                `${this.prefixLog} Aborting. Failed to fetch all tokens. Link: ${link} Reason: ${ex.message}`
            )

            return
        }

        for (const token of tokens) {
            const tokenId: string = token.name.toString().toLowerCase().replace(' ', '-')

            if (tokenId.length <= 0 || tokenId.startsWith('realt-')) {
                continue
            }

            if (await this.checkedTokenService.isChecked(tokenId, this.workerName)) {
                this.logger.warn(`${this.prefixLog} ${tokenId} already checked. Skipping`)

                return
            }

            const address: string = token.address

            if (address.length <= 0) {
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

            const tokenInDb = await this.tokenService.findByAddress(address, currentBlockchain)

            if (tokenInDb) {
                continue
            }

            await this.tokenService.addIfNotExists(
                address,
                coinName,
                websites,
                [ '' ],
                allLinks,
                this.workerName,
                currentBlockchain
            )

            this.logger.info(
                `${this.prefixLog} Added to DB:`,
                [
                    address,
                    coinName,
                    websites,
                    allLinks,
                    this.workerName,
                    currentBlockchain,
                ]
            )
        }
    }

    private getAllCoinsLink(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return 'https://tokens.coingecko.com/binance-smart-chain/all.json'
            case Blockchain.ETH:
                return 'https://tokens.coingecko.com/ethereum/all.json'
            case Blockchain.CRO:
                return 'https://tokens.coingecko.com/cronos/all.json'
            default:
                throw new Error(
                    `Wrong blockchain provided. ` +
                    `All coins link doesn't exists for provided blockchain ${currentBlockchain}`
                )
        }
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
