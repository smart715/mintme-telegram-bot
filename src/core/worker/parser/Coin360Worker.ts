import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { ParserWorkersService, TokenCachedDataService, TokensService } from '../../service'
import { Blockchain, logger, parseBlockchainName, sleep } from '../../../utils'
import { JSDOM } from 'jsdom'

@singleton()
export class Coin360Worker extends AbstractTokenWorker {
    private readonly workerName = 'Coin360'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    public constructor(
        private readonly parserWorkersService: ParserWorkersService,
        private readonly tokenService: TokensService,
        private readonly tokenCachedDataService: TokenCachedDataService
    ) {
        super()
    }

    public async run(): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        const coins = await this.parserWorkersService.loadCoin360Tokens()

        for (const coin of coins) {
            if (coin.c != 'token') {
                continue
            }

            const coinId = coin.n.toLowerCase().replace(' ', '-') + '-' + coin.s.toLowerCase().trim()

            if (await this.tokenCachedDataService.isCached(coinId, this.workerName)) {
                logger.warn(`${this.prefixLog} Data for coin ${coinId} already cached. Skipping`)

                continue
            }

            const coinPageSource = await this.parserWorkersService.loadCoin360Token(coinId)
            const coinPageDocument = (new JSDOM(coinPageSource)).window.document

            let blockchain
            try {
                blockchain = parseBlockchainName(coinPageDocument.getElementsByClassName('mr-3')[0].innerHTML)
            } catch (err) {
                logger.warn(`${this.prefixLog} Unknown blockchain for coin ${coinId}. Skipping`)

                continue
            }

            const infoElements = coinPageDocument.getElementsByClassName('styles_item___uOnu')
            const tokenName = `${coin.n}(${coin.s})`
            let tokenAddress = ''
            let website = ''
            let links: string[] = []

            Array.from(infoElements).forEach(el => {
                const linkType = el.getElementsByTagName('div')[0].innerText.toLowerCase()

                switch (linkType) {
                    case 'website':
                        website = el.getElementsByTagName('div')[1].getElementsByTagName('a')[0].href
                        break
                    case 'explorers': {
                        const link = el.getElementsByTagName('div')[1].getElementsByTagName('a')[0].href
                        tokenAddress = link.split('/')[link.split('/').length -1].toLowerCase()
                        break
                    }
                    case 'community': {
                        const linksElements = el.getElementsByTagName('div')[1].getElementsByTagName('a')
                        links = Array.from(linksElements).map((el) => el.href)
                        break
                    }
                }
            })

            if (this.supportedBlockchains.includes(blockchain) && tokenAddress?.startsWith('0x')) {
                await this.tokenService.addIfNotExists(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    blockchain,
                )

                logger.info(
                    `${this.prefixLog} Token saved to database:`,
                    tokenAddress,
                    tokenName,
                    website,
                    this.workerName,
                    blockchain
                )
            } else {
                logger.error(`${this.prefixLog} Unsupported blockchain or wrong data for ${coinId}. Skipping`)
            }

            await this.tokenCachedDataService.cacheTokenData(coinId, this.workerName, tokenAddress || '')

            await sleep(2000)
        }

        logger.info(`${this.prefixLog} worker finished`)
    }
}
