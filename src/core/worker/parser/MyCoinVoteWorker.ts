import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { RetryAxios, Blockchain, tokenAddressRegexp } from '../../../utils'
import { NewestCheckedTokenService, TokensService } from '../../service'
import { NewestTokenChecker, StopCheckException } from './NewestTokenChecker'

@singleton()
export class MyCoinVoteWorker extends NewestTokenChecker {
    private readonly predefinedTokenOffset = 1
    private readonly tokenAddressPrefix = '/'
    private readonly tokenAddressRegexp = this.tokenAddressPrefix + tokenAddressRegexp

    public constructor(
        protected readonly newestCheckedTokenService: NewestCheckedTokenService,
        private readonly tokensService: TokensService,
        private readonly retryAxios: RetryAxios,
        protected readonly logger: Logger,
    ) {
        super(
            MyCoinVoteWorker.name,
            newestCheckedTokenService,
            logger,
        )
    }

    protected override async checkPage(page: number): Promise<void> {
        const tokens = await this.fetchTokens(page)

        if (this.noTokens(tokens)) {
            throw new StopCheckException(this.allPagesAreChecked)
        }

        for (let i = this.predefinedTokenOffset; i < tokens.length; i++) {
            await this.processToken(tokens[i])
        }
    }

    private async fetchTokens(page: number): Promise<string[]> {
        const response = await this.retryAxios.get(this.buildPageUrl(page), this.logger)

        return response.data.newcoin.match(new RegExp('<tr>(.+?)</tr>', 'gs')) ?? []
    }

    private buildPageUrl(page: number): string {
        return 'https://www.mycoinvote.com/index.php/Coins/getNewCoins/' + page
    }

    private noTokens(tokens: string[]): boolean {
        return this.predefinedTokenOffset >= tokens.length
    }

    private async processToken(tokenInfo: string): Promise<void> {
        const blockchain = this.getBlockchain(tokenInfo)
        const tokenUrl = this.getTokenUrl(tokenInfo)

        await this.newestCheckedCheck(tokenUrl)

        const tokenPage = await this.fetchTokenPage(tokenUrl)

        if (!tokenPage) {
            return
        }

        const tokenAddress = this.getTokenAddress(tokenPage)
        const tokenName = this.getTokenName(tokenPage)
        const webSites = this.getWebsites(tokenPage)
        const links = this.getLinks(tokenPage)

        if (!blockchain || !tokenAddress) {
            return
        }

        await this.tokensService.addOrUpdateToken(
            tokenAddress,
            tokenName,
            webSites,
            [],
            links,
            this.workerName,
            blockchain,
            this.logger
        )
    }

    private getBlockchain(tokenInfo: string): Blockchain | null {
        return tokenInfo.includes('BSC')
            ? Blockchain.BSC
            : tokenInfo.includes('ETH')
                ? Blockchain.ETH
                : null
    }

    private getTokenUrl(tokenInfo: string): string {
        return tokenInfo.match(new RegExp('href="(.+?)"'))
            ?.[0].replace('href="', '').replace('"', '').toLowerCase()
            ?? ''
    }

    private async fetchTokenPage(url: string): Promise<string | null> {
        try {
            const response = await this.retryAxios.get(url, this.logger)

            return response.data
        } catch (error: any) {
            // some token links are broken for several reasons, better to skip them
            return null
        }
    }

    private getTokenAddress(tokenPage: string): string {
        return tokenPage.toLowerCase().match(new RegExp(this.tokenAddressRegexp))
            ?.[0].replace(this.tokenAddressPrefix, '')
            ?? ''
    }

    private getTokenName(tokenPage: string): string {
        const nameAndSymbolElement = tokenPage.match(new RegExp('<h1 class="mt-1">(.+?)</h1>', 's'))?.[0] ?? ''

        const name = nameAndSymbolElement.match(new RegExp('<h1 class="mt-1">(.+?)<div', 's'))
            ?.[0].replace('<h1 class="mt-1">', '').replace('<div', '').trim()
            ?? ''
        const symbol = nameAndSymbolElement.match(new RegExp('<h2 style="margin:1px;">(.+?)</h2>'))
            ?.[0].replace('<h2 style="margin:1px;">', '').replace('</h2>', '').trim()
            ?? ''

        return `${name} (${symbol})`
    }

    private getWebsites(tokenPage: string): string[] {
        const linksObject = this.getLinksObject(tokenPage)

        if (linksObject.includes('Website')) {
            const links = this.getLinks(tokenPage)
            return [ links[0] ]
        }

        return []
    }

    private getLinks(tokenPage: string): string[] {
        const linksObject = this.getLinksObject(tokenPage)
        const linkElements = linksObject.match(new RegExp('href="(.+?)"', 'g')) ?? []

        return linkElements.map(rawLink => rawLink.replace('href="', '').replace('"', '').toLowerCase())
    }

    private getLinksObject(tokenPage: string): string {
        return tokenPage.match(
            new RegExp('<div class="col-md-4 col-lg-4 col-sm-6">(.+?)<div class="table-responsive">(.+?)<h3>Price</h3>', 's')
        )?.[0] ?? ''
    }
}
