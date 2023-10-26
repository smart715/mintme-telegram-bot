import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain } from '../../../utils'
import { CheckedTokenService, CoinBrainService, TokensService } from '../../service'
import { CoinBrainGetTokensGeneralResponse } from '../../types'
import { DOMWindow, JSDOM } from 'jsdom'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinBrainWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinBrain'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly coinBrainService: CoinBrainService,
        private readonly tokenService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        let endCursor = ''
        let hasNextPage = true
        let page = 1

        do {
            this.logger.info(`${this.prefixLog} Page: ${page}`)
            page += 1

            let res: CoinBrainGetTokensGeneralResponse

            try {
                res = await this.coinBrainService.getTokens(endCursor)
            } catch (ex: any) {
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all tokens. Page: ${page}. EndCursor: ${endCursor}. Reason: ${ex.message}`
                )

                return
            }

            hasNextPage = res.hasNextPage
            endCursor = res.endCursor.toString()

            const coins = res.items

            for (const coin of coins) {
                const address = coin.address.toLowerCase()

                const currentBlockchain = this.getSupportedBlockchainByChainId(Number(coin.chainId))

                if (!currentBlockchain) {
                    continue
                }

                const cryptoPagePrefix = this.getCryptoPagePrefix(currentBlockchain)

                if (!cryptoPagePrefix) {
                    continue
                }

                if (await this.checkedTokenService.isChecked(address, this.workerName)) {
                    this.logger.warn(`${this.prefixLog} ${address} already checked. Skipping`)

                    continue
                }

                const tokenInfoStr = await this.coinBrainService.getTokenInfo(cryptoPagePrefix, address)
                const tokeInfoDOM = (new JSDOM(tokenInfoStr)).window

                const linksElements = this.getLinksElements(tokeInfoDOM)
                const tokenName = this.getTokenName(tokeInfoDOM)

                let website = ''
                const links: string[] = []

                for (const linkEl of linksElements) {
                    if ('' === website && 'website' === linkEl.dataset['type']) {
                        website = linkEl.href
                    } else {
                        links.push(linkEl.href)
                    }
                }

                if (links.length <= 0 || website.length <= 0) {
                    continue
                }

                await this.tokenService.addOrUpdateToken(
                    address,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    currentBlockchain
                )


                await this.checkedTokenService.saveAsChecked(address, this.workerName)

                this.logger.info(
                    `${this.prefixLog} Added to DB:`,
                    [
                        address,
                        tokenName,
                        website,
                        links,
                        this.workerName,
                        currentBlockchain,
                    ]
                )
            }
        } while (hasNextPage)
    }

    private getSupportedBlockchainByChainId(chainId: number): Blockchain|null {
        switch (chainId) {
            case 56:
                return Blockchain.BSC
            case 1:
                return Blockchain.ETH
            default:
                return null
        }
    }

    private getCryptoPagePrefix(currentBlockchain: Blockchain): string|null {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return 'bnb'
            case Blockchain.ETH:
                return 'eth'
            default:
                this.logger.error(
                    `${this.prefixLog} current blockchain ${currentBlockchain} doesn't have crypto ` +
                    `prefix specified. Pls specify it in code. Aborting.`)

                return null
        }
    }

    private getTokenName(tokenInfoDOM: DOMWindow): string {
        return tokenInfoDOM
            .document
            .getElementsByTagName('h1')[0]
            .getElementsByClassName('css-1vy8s6x ekbh7yg0')[0]
            .textContent +
                ' (' +
                tokenInfoDOM
                    .document
                    .getElementsByTagName('h1')[0]
                    .getElementsByClassName('css-g65rr5 ekbh7yg0')[0].textContent +
                ')'
    }

    private getLinksElements(tokeInfoDOM: DOMWindow): HTMLCollectionOf<HTMLAnchorElement> {
        return tokeInfoDOM
            .document
            .getElementsByClassName('css-bbxkir emf55gs0')[0]
            .getElementsByTagName('a')
    }
}
