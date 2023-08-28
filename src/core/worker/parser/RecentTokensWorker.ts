import { DOMWindow, JSDOM } from 'jsdom'
import { Logger } from 'winston'
import {
    Blockchain,
    findContractAddress,
    getHrefFromTagString,
    getHrefValuesFromTagString,
    sleep,
} from '../../../utils'
import { NewestCheckedTokenService, RecentTokensService, TokensService } from '../../service'
import { NewestTokenChecker, StopCheckException } from './NewestTokenChecker'

export class RecentTokensWorker extends NewestTokenChecker {
    protected readonly workerName = 'RecentTokens'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ Blockchain.CRO ]
    private blockchain: Blockchain|null

    public constructor(
        private readonly recentTokensService: RecentTokensService,
        private readonly tokenService: TokensService,
        protected readonly newestCheckedTokenService: NewestCheckedTokenService,
        protected readonly logger: Logger,
    ) {
        super(
            RecentTokensWorker.name,
            newestCheckedTokenService,
            logger
        )
    }

    public async run(currentBlockchain: Blockchain = Blockchain.BSC): Promise<void> {
        this.logger.info(`${this.prefixLog} Started`)

        this.blockchain = currentBlockchain

        if (this.unsupportedBlockchains.includes(this.blockchain)) {
            this.logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        this.newestChecked = await this.getNewestChecked(this.blockchain)
        this.needToSaveNextNewestChecked = true
        let page = 1

        try {
            while (true) { // eslint-disable-line
                this.logger.info(`${this.prefixLog} Checking page: ${page}`)

                await this.checkPage(page)
                await sleep(this.sleepTimeBetweenPages)

                page += 1
            }
        } catch (error: any) {
            if (error instanceof StopCheckException) {
                this.logger.info(`${this.prefixLog}}${error.message}`)
            } else {
                this.logger.error(`${this.prefixLog} ${error.message}`)

                throw error
            }
        } finally {
            this.logger.info(`${this.prefixLog} Finished`)
        }
    }

    protected override async checkPage(page: number): Promise<void> {
        const tokens = await this.fetchTokens(page)

        if (this.noTokens(tokens)) {
            throw new StopCheckException(this.allPagesAreChecked)
        }

        for (const token of tokens) {
            await this.processToken(token)
        }
    }

    private async processToken(token: Element): Promise<void> {
        if (!this.blockchain) {
            return
        }

        const tokenLink = this.getTokenLink(token)

        if (!tokenLink) {
            return
        }

        await this.newestCheckedCheck(tokenLink, this.blockchain)

        let tokenPageInfo: string

        try {
            tokenPageInfo = await this.recentTokensService.getTokenInfoPage(tokenLink)
        } catch (ex: any) {
            this.logger.error(
                `${this.prefixLog} Failed to get token page. Page link: ${tokenLink} Reason: ${ex.message}. Skipping...`
            )

            return
        }

        const tokenAddress = findContractAddress(tokenPageInfo)

        if (!tokenAddress) {
            return
        }

        const tokenInDb = await this.tokenService.findByAddress(tokenAddress, this.blockchain)

        if (tokenInDb) {
            return
        }

        const tokenPageDOM = this.getDOMPageInfo(tokenPageInfo)
        const tokenName = this.getTokenName(tokenPageDOM)

        if (!tokenName) {
            return
        }

        const website = this.getWebsite(tokenPageInfo)
        const links = this.getLinks(tokenPageInfo)

        this.logger.info(`${this.prefixLog} Check ${tokenName}`)

        if (0 === links.length) {
            return
        }

        await this.tokenService.addIfNotExists(
            tokenAddress,
            tokenName,
            [ website ],
            [ '' ],
            links,
            this.workerName,
            this.blockchain
        )

        this.logger.info(
            `${this.prefixLog} Added to DB:`,
            [
                tokenAddress,
                tokenName,
                website,
                links,
                this.workerName,
                this.blockchain,
            ]
        )
    }

    private async fetchTokens(page: number): Promise<HTMLCollectionOf<Element>> {
        const targetBlockchain = this.getTargetBlockchain()

        let tokensPageStr: string

        try {
            tokensPageStr = await this.recentTokensService.getAllTokensPage(targetBlockchain, page)
        } catch (ex: any) {
            this.logger.error(
                `${this.prefixLog} Aborting. Failed to get all tokens page. Page: ${page} Reason: ${ex.message}`
            )

            throw ex
        }

        const allTokensDOM = (new JSDOM(tokensPageStr)).window

        return this.geTokenDivs(allTokensDOM)
    }

    private noTokens(tokens: HTMLCollectionOf<Element>): boolean {
        return 0 === tokens.length
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
        const tableRegex: RegExp = /<table\b[^>]*class="table table-hover text-nowrap align-middle"[^>]*>(.*?)<\/table>/g

        const purePageInfo = tokenPageInfo.replace(tableRegex, '')

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
            .getElementsByClassName('table-coin-info')
    }

    private getTargetBlockchain(): string {
        switch (this.blockchain) {
            case Blockchain.ETH:
                return 'ethereum'
            case Blockchain.BSC:
                return 'bsc'
            default:
                throw new Error('Wrong blockchain provided. Target blockchain doesn\'t exists for provided blockchain')
        }
    }
}
