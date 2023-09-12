import { singleton } from 'tsyringe'
import { Blockchain, sleep } from '../../../utils'
import { CoinScopeService, CheckedTokenService, SeleniumService, TokensService } from '../../service'
import { JSDOM } from 'jsdom'
import { WebDriver } from 'selenium-webdriver'
import { Logger } from 'winston'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinScopeWorker extends AbstractParserWorker {
    public readonly workerName: string = 'CoinScope'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = Object.values(Blockchain)

    private webDriver: WebDriver

    public constructor(
        private readonly coinScopeService: CoinScopeService,
        private readonly tokensService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.webDriver = await SeleniumService.createDriver('', undefined, this.logger)

        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<any> {
        this.logger.info(`${this.prefixLog} Worker started for ${currentBlockchain} blockchain`)

        const reactFolder = await this.getReactBuildFolderName()

        let page = 1

        while (true) { // eslint-disable-line
            const tokensData = await this.coinScopeService.getTokensData(
                reactFolder,
                page,
                currentBlockchain
            )
            const coinSlugs = tokensData?.pageProps?.coinSlugs

            page++

            if (!coinSlugs || 0 === coinSlugs.length) {
                break
            }

            for (const coinSlug of coinSlugs) {
                if (await this.checkedTokenService.isChecked(coinSlug.toLowerCase(), this.workerName)) {
                    this.logger.warn(`Found cached data for ${coinSlug}. Skipping`)

                    continue
                }

                await this.processTokenData(coinSlug, currentBlockchain)

                await sleep(3000)
            }

            await sleep(2000)
        }

        this.logger.info(`${this.prefixLog} worker finished for ${currentBlockchain} blockchain`)
    }

    private async processTokenData(tokenId: string, currentBlockchain: Blockchain): Promise<void> {
        const tokenData = await this.scrapeTokenData(tokenId)

        await this.checkedTokenService.saveAsChecked(
            tokenId.toLowerCase(),
            this.workerName,
        )

        if (!tokenData.tokenAddress) {
            this.logger.warn(`Address not found for ${tokenId} (${tokenData.tokenName}). Skipping`)

            return
        }

        await this.tokensService.addIfNotExists(
            tokenData.tokenAddress,
            `${tokenData.tokenName} (${tokenId.toUpperCase()})`,
            [ tokenData.website ],
            [ '' ],
            tokenData.links,
            this.workerName,
            currentBlockchain,
        )

        this.logger.info(
            `${this.prefixLog} Token saved to database:`,
            [ tokenData.tokenAddress, `${tokenData.tokenName} (${tokenId.toUpperCase()})`, currentBlockchain ]
        )
    }

    private async getReactBuildFolderName(): Promise<string> {
        const pageSource = await this.coinScopeService.getMainPage()
        const pageDOM = (new JSDOM(pageSource)).window

        const scripts = pageDOM.document.getElementsByTagName('script')

        for (let i = 0; i < scripts.length; i++) {
            if (!scripts[i].src.includes('_buildManifest')) {
                continue
            }

            return scripts[i].src.split('/')[scripts[i].src.split('/').length - 2]
        }

        return ''
    }

    private async scrapeTokenData(tokenId: string): Promise<{
        tokenAddress: string,
        tokenName: string,
        website: string,
        links: string[]
    }> {
        // using selenium here because of site's firewall, and parsing by jsdom because it is comfortable
        await this.webDriver.get(`https://www.coinscope.co/coin/${tokenId.toLowerCase()}`)

        const pageSource = await this.webDriver.getPageSource()
        const pageDOM = (new JSDOM(pageSource)).window

        const links = pageDOM.document
            .getElementsByClassName('StyledBox-sc-13pk1d4-0 gxWSzQ')[0]?.getElementsByTagName('a')|| []
        let website = ''
        const otherLinks = []

        for (const link of links) {
            if ('Website link' === link.getAttribute('title')) {
                website = link.href
            }

            otherLinks.push(link.href)
        }

        return {
            tokenAddress: pageDOM.document
                .querySelector('.StyledBox-sc-13pk1d4-0.fSCGoT .StyledText-sc-1sadyjn-0.kvWNBW')?.innerHTML || '',
            tokenName: pageDOM.document.title.split('| ')[1],
            website,
            links: otherLinks,
        }
    }
}
