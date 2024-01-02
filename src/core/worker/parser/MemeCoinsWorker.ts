import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { RetryAxios, Blockchain, tokenAddressRegexp } from '../../../utils'
import { NewestCheckedTokenService, TokensService } from '../../service'
import { NewestTokenChecker, StopCheckException } from './NewestTokenChecker'

@singleton()
export class MemeCoinsWorker extends NewestTokenChecker {
    public constructor(
        protected readonly newestCheckedTokenService: NewestCheckedTokenService,
        private readonly tokensService: TokensService,
        private readonly retryAxios: RetryAxios,
        protected readonly logger: Logger,
    ) {
        super(
            MemeCoinsWorker.name,
            newestCheckedTokenService,
            logger,
        )
    }

    protected override async checkPage(page: number): Promise<void> {
        const tokens = await this.fetchTokens(page)

        if (!tokens.length) {
            throw new StopCheckException(this.allPagesAreChecked)
        }

        for (const tokenInfo of tokens) {
            await this.processToken(tokenInfo)
        }
    }

    private async fetchTokens(page: number): Promise<string[]> {
        const response = await this.retryAxios.get(this.buildPageUrl(page), this.logger)

        return response.data.match(new RegExp('<tr>(.+?)</tr>', 'gs')) ?? []
    }

    private buildPageUrl(page: number): string {
        return 'https://memecoins.club/?order=c-a&page=' + page
    }

    private async processToken(tokenInfo: string): Promise<void> {
        const blockchain = this.getBlockchain(tokenInfo)
        const tokenAddress = this.getTokenAddress(tokenInfo)
        const tokenName = this.getTokenName(tokenInfo)
        const webSites = this.getWebsites(tokenInfo)

        await this.newestCheckedCheck(tokenName)

        if (!blockchain || !tokenAddress) {
            return
        }

        await this.tokensService.addOrUpdateToken(
            tokenAddress,
            tokenName,
            webSites,
            [],
            [],
            this.workerName,
            blockchain,
            this.logger
        )
    }

    private getBlockchain(tokenInfo: string): Blockchain | null {
        if (tokenInfo.includes('BSC')) {
            return Blockchain.BSC
        } else if (tokenInfo.includes('ETH')) {
            return Blockchain.ETH
        } else if (tokenInfo.includes('Polygon')) {
            return Blockchain.MATIC
        }

        return null
    }

    private getTokenAddress(tokenInfo: string): string {
        return tokenInfo.toLowerCase().match(new RegExp(tokenAddressRegexp))?.[0] ?? ''
    }

    private getTokenName(tokenInfo: string): string {
        const firstMatch = tokenInfo.match(new RegExp('nn>(.+?)</a>'))?.[0] ?? ''
        const secondMatch = firstMatch.match(new RegExp('">(.+?)</a>'))
            ?? firstMatch.match(new RegExp('rel=nofollow>(.+?)</a>'))

        return secondMatch?.[0]
            .replace('">', '')
            .replace('rel=nofollow>', '')
            .replace('</a>', '')
            ?? ''
    }

    private getWebsites(tokenInfo: string): string[] {
        const links = this.getLinks(tokenInfo)

        if (2 < links.length) {
            return [ 'https://memecoins.club/' + links[0] ]
        }

        return []
    }

    private getLinks(tokenInfo: string): string[] {
        const rawLinks = tokenInfo.match(new RegExp('href="(.+?)"', 'g')) ?? []

        return rawLinks.map(rawLink => rawLink.replace('href="', '').replace('"', ''))
    }
}
