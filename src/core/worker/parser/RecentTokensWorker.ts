import {DOMWindow, JSDOM} from 'jsdom'
import {AbstractTokenWorker} from '../AbstractTokenWorker'
import {Blockchain, findContractAddress, getHrefFromTagString, getHrefValuesFromTagString, logger} from '../../../utils'
import {RecentTokensService, TokensService} from '../../service'

export class RecentTokensWorker extends AbstractTokenWorker {
    private readonly workerName = 'RecentTokens'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]

    public constructor(
        private readonly recentTokensService: RecentTokensService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        let page = 1
        let tokensCount = 0
        const targetBlockchain = this.getTargetBlockchain(currentBlockchain)

        do {
            logger.info(`${this.prefixLog} Page: ${page}`)

            let tokensPageStr: string

            try {
                tokensPageStr = await this.recentTokensService.getAllTokensPage(targetBlockchain, page)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to get all tokens page. Page: ${page} Reason: ${ex.message}`
                )

                return
            }

            const allTokensDOM = (new JSDOM(tokensPageStr)).window

            const tokens  = this.geTokenDivs(allTokensDOM)

            tokensCount = tokens.length

            for (const token of tokens) {
                const tokenLink = this.getTokenLink(token)

                if (!tokenLink) {
                    continue
                }

                let tokenPageInfo: string

                try {
                    tokenPageInfo = await this.recentTokensService.getTokenInfoPage(tokenLink)
                } catch (ex: any) {
                    logger.error(
                        `${this.prefixLog} Failed to get token page. Page link: ${tokenLink} Reason: ${ex.message}. Skipping...`
                    )

                    continue
                }

                const tokenAddress = findContractAddress(tokenPageInfo)

                if (!tokenAddress) {
                    continue
                }

                const tokenInDb = await this.tokenService.findByAddress(tokenAddress, currentBlockchain)

                if (tokenInDb) {
                    continue
                }

                const tokenPageDOM = this.getDOMPageInfo(tokenPageInfo)

                const tokenName = this.getTokenName(tokenPageDOM)

                if (!tokenName) {
                    continue
                }

                const website = this.getWebsite(tokenPageInfo)
                const links = this.getLinks(tokenPageInfo)

                logger.info(`${this.prefixLog} Check ${tokenName}`)

                if (0 === links.length) {
                    continue
                }

                await this.tokenService.add(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    currentBlockchain
                )

                logger.info(
                    `${this.prefixLog} Added to DB:`,
                    tokenAddress,
                    tokenName,
                    website,
                    links,
                    this.workerName,
                    currentBlockchain
                )
            }
            
            page += 1
        } while (tokensCount > 0)
    }

    private getLinks(tokenPageInfo: string): string[] {
        const matchedSocialTr = tokenPageInfo.match(/<tr>(?:\t*)<td class="px-0">Social profiles:<\/td>(.+?)<\/tr>/)

        if (!matchedSocialTr) {
            return []
        }

        return getHrefValuesFromTagString(matchedSocialTr)
    }

    private getWebsite(tokenPageInfo: string): string {
        const matchedWebsiteTd = tokenPageInfo
            .match(/<td class="px-0">Official site:<\/td>(.+?)<td class="px-0">Social profiles:<\/td>/)

        if (null === matchedWebsiteTd) {
            return ''
        }

        return getHrefFromTagString(matchedWebsiteTd)
    }

    private getDOMPageInfo(tokenPageInfo: string): DOMWindow {
        // remove useless part of html doc to prevent memory leak
        const tableRegex: RegExp = /<table\b[^>]*class="table table-hover text-nowrap align-middle"[^>]*>(.*?)<\/table>/g;

        const purePageInfo = tokenPageInfo.replace(tableRegex, '');

        return (new JSDOM(purePageInfo)).window
    }

    private getTokenName(tokenPageDOM: DOMWindow): string|null {
        const h1Tags = tokenPageDOM
            .document
            .getElementsByTagName('h1')

        const titleMatchedRegEx = h1Tags[0].innerHTML.match(/alt="([^"]+)"/)

        if (!titleMatchedRegEx) {
            return null
        }

        const symbolAndName = titleMatchedRegEx[1].split(' - ')

        return symbolAndName[1] + '(' + symbolAndName[0] + ')'
    }

    private getTokenLink(token: Element): string|null {
        const linkTag = token.getElementsByTagName('a')[0]

        if (!linkTag) {
            return null
        }

        return linkTag.href
    }

    private geTokenDivs(allTokensDOM: DOMWindow): HTMLCollectionOf<Element> {
        return allTokensDOM
            .document
            .getElementsByClassName('table-coin-info');
    }

    private getTargetBlockchain(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.ETH:
                return 'ethereum'
            case Blockchain.BSC:
                return 'bsc'
            default:
                throw new Error('Wrong blockchain provided. Target blockchain doesn\'t exists for provided blockchain')
        }
    }
}
