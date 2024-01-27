import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain, tokenAddressRegexp, getBlockchainFromContent } from '../../../utils'
import { CheckedTokenService, FirewallService, SeleniumService, TokensService } from '../../service'
import { AbstractParserWorker } from './AbstractParserWorker'
import { By, WebDriver } from 'selenium-webdriver'

@singleton()
export class GemFinderWorker extends AbstractParserWorker {
    private readonly workerName = 'GemFinder'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly tokenIdRegexp = new RegExp('gem/[0-9]{1,8}', 'gs')
    private readonly tokenIdPrefix = 'gem/'
    private webDriver: WebDriver

    public constructor(
        private readonly tokensService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly fireWallService: FirewallService,
        protected readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        this.webDriver = await SeleniumService.createCloudFlareByPassedDriver(
            this.buildPageUrl(1),
            this.fireWallService,
            this.logger,
        )

        let page = 1
        while (true) { // eslint-disable-line
            const tokenIds = await this.fetchTokenIds(page)

            if (!tokenIds.length) {
                break
            }

            for (const tokenId of tokenIds) {
                await this.processToken(tokenId.replace(this.tokenIdPrefix, ''))
            }

            page++
        }

        this.logger.info(`${this.prefixLog} Worker finished`)
    }

    private async fetchTokenIds(page: number): Promise<string[]> {
        await this.loadPage(this.buildPageUrl(page))
        const pageSrc = await this.webDriver.getPageSource()

        return pageSrc.toLowerCase().match(this.tokenIdRegexp) ?? []
    }

    private async loadPage(url: string): Promise<void> {
        const { isNewDriver, newDriver } = await SeleniumService.loadPotentialCfPage(
            this.webDriver,
            url,
            this.fireWallService,
            this.logger
        )

        if (isNewDriver) {
            this.webDriver = newDriver
        }
    }

    private buildPageUrl(page: number): string {
        return 'https://gemfinder.cc/all-time-best-ajax?page=' + page
    }

    private async processToken(tokenId: string): Promise<void> {
        if (await this.checkedTokenService.isChecked(tokenId, this.workerName)) {
            this.logger.warn(`${this.prefixLog} ${tokenId} already checked. Skipping`)

            return
        }

        const tokenInfo = await this.fetchTokenInfo(tokenId)
        const tokenAddress = this.getTokenAddress(tokenInfo)
        const blockchain = await this.getBlockchain()
        const tokenName = this.getTokenName(tokenInfo)
        const links = this.getLinks(tokenInfo)
        const websites = this.getWebsites(tokenInfo)

        await this.checkedTokenService.saveAsChecked(tokenId, this.workerName)

        if (!tokenAddress || !blockchain) {
            this.logger.warn(`${this.prefixLog} No address/Supported blockchain found for ${tokenId}. Skipping`)

            return
        }

        await this.tokensService.addOrUpdateToken(
            tokenAddress,
            tokenName,
            websites,
            [],
            links,
            this.workerName,
            blockchain,
            this.logger
        )

        this.logger.info(
            `${this.prefixLog} Token saved to database:`,
            [ tokenAddress, tokenName, blockchain ],
        )
    }

    private async fetchTokenInfo(tokenId: string): Promise<string> {
        await this.loadPage(this.buildTokenInfoUrl(tokenId))

        const pageSrc = await this.webDriver.getPageSource()

        return pageSrc.toLowerCase()
    }

    private buildTokenInfoUrl(tokenId: string): string {
        return 'https://gemfinder.cc/gem/' + tokenId
    }


    private async getBlockchain(): Promise<Blockchain | null> {
        const contractSectionSelector = await this.webDriver.findElements(By.className('coin_contract'))

        if (!contractSectionSelector.length) {
            return null
        }

        const contractSectionText = await contractSectionSelector[0].getText()

        return getBlockchainFromContent(contractSectionText)
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
