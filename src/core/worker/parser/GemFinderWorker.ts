import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { RetryAxios, Blockchain, tokenAddressRegexp } from '../../../utils'
import { NewestCheckedTokenService, TokensService } from '../../service'
import { NewestTokenChecker, StopCheckException } from './NewestTokenChecker'

@singleton()
export class GemFinderWorker extends NewestTokenChecker {
    private readonly tokenIdRegexp = new RegExp('gem/[0-9]{1,8}', 'gs')
    private readonly tokenIdPrefix = 'gem/'

    public constructor(
        protected readonly newestCheckedTokenService: NewestCheckedTokenService,
        private readonly tokensService: TokensService,
        private readonly retryAxios: RetryAxios,
        protected readonly logger: Logger,
    ) {
        super(
            GemFinderWorker.name,
            newestCheckedTokenService,
            logger,
        )
    }

    protected override async checkPage(page: number): Promise<void> {
        const tokenIds = await this.fetchTokenIds(page)

        if (!tokenIds.length) {
            throw new StopCheckException(this.allPagesAreChecked)
        }

        for (const tokenId of tokenIds) {
            await this.processToken(tokenId.replace(this.tokenIdPrefix, ''))
        }
    }

    private async fetchTokenIds(page: number): Promise<string[]> {
        const response = await this.retryAxios.get(this.buildPageUrl(page))

        return response.data.toLowerCase().match(this.tokenIdRegexp) ?? []
    }

    private buildPageUrl(page: number): string {
        return 'https://gemfinder.cc/all-time-best-ajax?page=' + page
    }

    private async processToken(tokenId: string): Promise<void> {
        await this.newestCheckedCheck(tokenId)

        const tokenInfo = await this.fetchTokenInfo(tokenId)
        const tokenAddress = this.getTokenAddress(tokenInfo)
        const blockchain = this.getBlockchain(tokenInfo)
        const tokenName = this.getTokenName(tokenInfo)
        const links = this.getLinks(tokenInfo)
        const websites = this.getWebsites(tokenInfo)

        if (!tokenAddress || !blockchain) {
            return
        }

        await this.tokensService.addIfNotExists(
            tokenAddress,
            tokenName,
            websites,
            [],
            links,
            this.workerName,
            blockchain,
        )
    }

    private async fetchTokenInfo(tokenId: string): Promise<string> {
        const response = await this.retryAxios.get(this.buildTokenInfoUrl(tokenId))

        return response.data.toLowerCase()
    }

    private buildTokenInfoUrl(tokenId: string): string {
        return 'https://gemfinder.cc/gem/' + tokenId
    }


    private getBlockchain(tokenInfo: string): Blockchain {
        return tokenInfo.includes('binance_address')
            ? Blockchain.BSC
            : Blockchain.ETH
    }

    private getTokenAddress(tokenInfo: string): string {
        return tokenInfo.match(new RegExp(tokenAddressRegexp))?.[0] ?? ''
    }

    private getTokenName(tokenInfo: string): string {
        const tokenName = tokenInfo.match(new RegExp('<h3 class="mb-0">(.+?)</h3>'))
            ?.[0].replace('<h3 class="mb-0">', '').replace('</h3>', '')
            ?? ''

        const tokenSymbol = tokenInfo.match(new RegExp('<p class="h4 text-muted mb-4">(.+?)</p>'))
            ?.[0].replace('<p class="h4 text-muted mb-4">', '').replace('</p>', '')
            ?? ''

        return `${tokenName} (${tokenSymbol})`
    }

    private getLinks(tokenInfo: string): string[] {
        const linkTags = this.getLinkTags(tokenInfo)
        const links: string[] = []

        linkTags.forEach(linkTag => {
            const link = linkTag.match(new RegExp('href="(.+?)"'))
                ?.[0].replace('href="', '').replace('"', '')
                ?? ''

            if (!linkTag.includes('website')) {
                links.push(link)
            }
        })

        return links
    }

    private getWebsites(tokenInfo: string): string[] {
        const linkTags = this.getLinkTags(tokenInfo)
        const websites: string[] = []

        linkTags.forEach(linkTag => {
            const link = linkTag.match(new RegExp('href="(.+?)"'))
                ?.[0].replace('href="', '').replace('"', '')
                ?? ''

            if (linkTag.includes('website')) {
                websites.push(link)
            }
        })

        return websites
    }

    private getLinkTags(tokenInfo: string): string[] {
        const linksDiv = tokenInfo.match(new RegExp('btn-group(.+?)row desktop', 's'))?.[0] ?? ''

        return linksDiv.match(new RegExp('<a(.+?)</a>', 'g')) ?? []
    }
}
