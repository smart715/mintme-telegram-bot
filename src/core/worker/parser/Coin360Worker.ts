import { singleton } from 'tsyringe'
import { Coins360Service, CheckedTokenService, TokensService } from '../../service'
import { Blockchain, sleep } from '../../../utils'
import { JSDOM } from 'jsdom'
import { Logger } from 'winston'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class Coin360Worker extends AbstractParserWorker {
    private readonly workerName = 'Coin360'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [ Blockchain.ETH, Blockchain.BSC ]

    public constructor(
        private readonly coins360Service: Coins360Service,
        private readonly tokenService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        const coins = await this.coins360Service.loadTokens()

        for (const coin of coins) {
            if (coin.c != 'token') {
                continue
            }

            const coinId = coin.n.toLowerCase().replace(' ', '-') + '-' + coin.s.toLowerCase().trim()

            if (await this.checkedTokenService.isChecked(coinId, this.workerName)) {
                this.logger.warn(`${this.prefixLog} Coin ${coinId} already checked. Skipping`)

                continue
            }

            const coinPageSource = await this.coins360Service.loadToken(coinId)
            const coinPageDocument = (new JSDOM(coinPageSource)).window.document

            const infoElements = coinPageDocument.getElementsByClassName('HxZs6e')
            const tokenName = `${coin.n}(${coin.s})`
            let tokenAddress = ''
            let website = ''
            let links: string[] = []
            let blockchain

            Array.from(infoElements).forEach(el => {
                const linkType = el.getElementsByTagName('div')[0].innerHTML.toLowerCase()

                switch (linkType) {
                    case 'website':
                        website = el.getElementsByTagName('div')[1].getElementsByTagName('a')[0].href
                        break
                    case 'explorers': {
                        const link = el.getElementsByTagName('div')[1].getElementsByTagName('a')[0].href
                        tokenAddress = link.split('/')[link.split('/').length -1].toLowerCase()

                        if (link.includes('etherscan')) {
                            blockchain = Blockchain.ETH
                        } else if (link.includes('bscscan')) {
                            blockchain = Blockchain.BSC
                        }

                        break
                    }
                    case 'community': {
                        const linksElements = el.getElementsByTagName('div')[1].getElementsByTagName('a')
                        links = Array.from(linksElements).map((el) => el.href)
                        break
                    }
                }
            })

            if (blockchain && this.supportedBlockchains.includes(blockchain) && tokenAddress?.startsWith('0x')) {
                await this.tokenService.addIfNotExists(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    blockchain,
                )

                this.logger.info(
                    `${this.prefixLog} Token saved to database:`,
                    [ tokenAddress, tokenName, blockchain ],
                )
            } else {
                this.logger.warn(`${this.prefixLog} Unsupported blockchain or wrong data for ${coinId}. Skipping`)
            }

            await this.checkedTokenService.saveAsChecked(coinId, this.workerName)

            await sleep(2000)
        }

        this.logger.info(`${this.prefixLog} worker finished`)
    }
}
