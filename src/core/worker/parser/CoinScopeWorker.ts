import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger, sleep } from '../../../utils'
import { ParserWorkersService, TokenCachedDataService, TokensService } from '../../service'
import { JSDOM } from 'jsdom'

@singleton()
export class CoinScopeWorker extends AbstractTokenWorker {
    public readonly workerName: string = 'CoinScope'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = Object.values(Blockchain)

    public constructor(
        private readonly parserWorkersService: ParserWorkersService,
        private readonly tokensService: TokensService,
        private readonly tokenCachedDataRepository: TokenCachedDataService,
    ) {
        super()
    }

    public async run(): Promise<void> {
        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<any> {
        logger.info(`${this.prefixLog} Worker started for ${currentBlockchain} blockchain`)

        const reactFolder = await this.getReactBuildFolderName()

        let page = 1

        // eslint-disable-next-line
        while (true) {
            const tokensData = await this.parserWorkersService.getCoinScopeTokensData(
                reactFolder,
                page,
                currentBlockchain
            )
            const coinSlugs = tokensData?.pageProps?.coinSlugs

            page++

            if (!coinSlugs || 0 === coinSlugs) {
                break
            }

            for (const coinSlug of coinSlugs) {
                if (await this.tokenCachedDataRepository.isCached(coinSlug.toLowerCase(), this.workerName)) {
                    logger.warn(`Found cached data for ${coinSlug}. Skipping`)

                    continue
                }

                await this.processTokenData(coinSlug, currentBlockchain)

                await sleep(2000)
            }

            await sleep(2000)
        }

        logger.info(`${this.prefixLog} worker finished for ${currentBlockchain} blockchain`)
    }

    private async processTokenData(tokenId: string, currentBlockchain: Blockchain): Promise<void> {
        const tokenData = await this.scrapeTokenData(tokenId)

        if (!tokenData.tokenAddress) {
            logger.warn(`Address not found for ${tokenId} (${tokenData.tokenName}). Skipping`)

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

        await this.tokenCachedDataRepository.cacheTokenData(
            tokenId.toLowerCase(),
            this.workerName,
            JSON.stringify(tokenData),
        )

        logger.info(`Successfuly saved data about ${tokenId}`)
    }

    private async getReactBuildFolderName(): Promise<string> {
        const pageSource = await this.parserWorkersService.getCoinScopeMainPage()
        const pageDOM = (new JSDOM(pageSource)).window

        const scripts = pageDOM.document.getElementsByTagName('script')
        let buildFolder = ''

        for (let i = 0; i < scripts.length; i++) {
            if (!scripts[i].src.includes('_buildManifest')) {
                continue
            }

            buildFolder = scripts[i].src.split('/')[scripts[i].src.split('/').length - 2]
            break
        }

        return buildFolder
    }

    private async scrapeTokenData(tokenId: string): Promise<{
        tokenAddress: string,
        tokenName: string,
        website: string,
        links: string[]
    }> {
        const pageSource = await this.parserWorkersService.loadCoinScopeTokenPage(tokenId)
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
