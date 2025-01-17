import { singleton } from 'tsyringe'
import { CoinsGodsService, CheckedTokenService, TokensService } from '../../service'
import { parseBlockchainName, sleep } from '../../../utils'
import { DOMWindow, JSDOM } from 'jsdom'
import { Logger } from 'winston'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinsGodsWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinsGods'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly coinsGodsService: CoinsGodsService,
        private readonly tokenService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        const pageContentSource = await this.coinsGodsService.loadTokens()
        const pageDOM = (new JSDOM(pageContentSource)).window

        const coinsIds = this.getCoinsIds(pageDOM)

        for (const coinId of coinsIds) {
            if (await this.checkedTokenService.isChecked(coinId, this.workerName)) {
                this.logger.warn(`${this.prefixLog} Coin ${coinId} already checked. Skipping`)

                continue
            }

            const coinPageSource = await this.coinsGodsService.loadTokenPage(coinId)
            const coinPageDocument = (new JSDOM(coinPageSource)).window.document

            const tokenAddress = coinPageDocument.getElementById('coin-text-address')?.innerHTML
            const tokenName = coinPageDocument.getElementsByTagName('h3')[0].innerHTML.toString().split(' <small')[0]
                + ' ('
                    + coinPageDocument.getElementsByTagName('h3')[0].getElementsByTagName('small')[0].innerHTML
                + ')'
            const linksElements = coinPageDocument.getElementsByClassName('mt-2 mt-lg-0')[0].getElementsByTagName('a')
            let website = ''
            const links = Array.from(linksElements).map((el) => {
                if (el.innerHTML.includes('Website')) {
                    website = el.href
                }

                return el.href
            })

            let blockchain
            try {
                blockchain = parseBlockchainName(coinPageDocument.getElementsByClassName('mr-3')[0].innerHTML)
            } catch (err) {
                this.logger.warn(`${this.prefixLog} Unknown blockchain for coin ${coinId}. Skipping`)

                continue
            }

            if (blockchain && tokenAddress) {
                await this.tokenService.addOrUpdateToken(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    blockchain,
                    this.logger
                )

                this.logger.info(
                    `${this.prefixLog} Token saved to database:`,
                    [ tokenAddress, tokenName, blockchain ],
                )
            } else {
                this.logger.warn(
                    `${this.prefixLog} Unsupported blockchain or wrong data ` +
                    `for ${coinId} (${tokenName}, ${blockchain} , ${tokenAddress}). Skipping`
                )
            }

            await this.checkedTokenService.saveAsChecked(coinId, this.workerName)

            await sleep(2000)
        }

        this.logger.info(`${this.prefixLog} worker finished`)
    }

    private getCoinsIds(dom: DOMWindow): string[] {
        const links = dom.document.getElementsByClassName('singlecoinlink')

        return Array.from(links).map((el) => {
            const href = el.getAttribute('data-href')?.split('/') || []

            return href[href?.length - 1]
        })
    }
}
