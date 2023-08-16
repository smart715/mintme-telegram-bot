import { DOMWindow, JSDOM } from 'jsdom'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger } from '../../../utils'
import { RecentTokensService, TokensService } from '../../service'

export class RecentTokensWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinBrain'
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

                logger.info(`${this.prefixLog} Link: ${tokenLink.href}`)
            }

            page += 1
        } while (tokensCount > 0)
    }

    private getTokenLink(token: Element): HTMLAnchorElement|undefined {
        return token.getElementsByTagName('a')[0]
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
