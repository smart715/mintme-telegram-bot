import { DOMWindow, JSDOM } from 'jsdom'
import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, findContractAddress, logger } from '../../../utils'
import { CoinBuddyService, TokensService } from '../../service'

@singleton()
export class CoinBuddyWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinBuddy'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly unsupportedBlockchains: Blockchain[] = [ ]

    public constructor(
        private readonly coinBuddyService: CoinBuddyService,
        private readonly tokenService: TokensService
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchains.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        const tag = this.getTagByBlockchain(currentBlockchain)

        if (null === tag) {
            logger.error(`${this.prefixLog} Tag for ${currentBlockchain} doesn't exists. Pls specify it in code. Aborting`)

            return
        }

        let page = 1
        let results = 50

        do {
            logger.info(`${this.prefixLog} Page start ${page}`)

            let coinsSrc = ''
            try {
                coinsSrc = await this.coinBuddyService.getAllCoins(tag, page)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all coins. Tag: ${tag}. Page: ${page}. Reason: ${ex.message}`
                )

                return
            }

            if ('' === coinsSrc) {
                logger.error(`${this.prefixLog} Aborting. Response for all coins returns empty string. Tag: ${tag}. Page: ${page}`)

                return
            }

            const coins = coinsSrc
                .replace('href="/coins/new_coins"', '')
                .match(/href="\/coins\/(.+?)"/g)

            if (null === coins) {
                results = 0

                continue
            }

            results = coins.length

            for (const coin of coins) {
                const path = this.getCoinInfoPagePath(coin)

                let coinInfo = ''
                try {
                    coinInfo = await this.coinBuddyService.getCoinInfo(path)
                } catch (ex: any) {
                    logger.error(
                        `${this.prefixLog} Aborting. Failed to fetch coin info. Tag: ${tag}. Page: ${page}. Reason: ${ex.message}`
                    )

                    return
                }

                const coinId = path.replace('/coins/', '')

                logger.info(`${this.prefixLog} Checking coin: ${coinId}`)

                if ('' === coinInfo) {
                    logger.info(`${this.prefixLog} Empty response for ${coinId}. Skipping`)

                    continue
                }

                const coinInfoDOM = (new JSDOM(coinInfo)).window
                const tokenName = coinInfoDOM.document.title.split('- Where')[0]
                const coinInfoDiv = this.getCoinInfoDiv(coinInfoDOM)
                const linkElements = coinInfoDiv.querySelectorAll('.external-link')
                const tokenAddress = this.findTokenAddress(coinInfoDiv, currentBlockchain)

                if (null === tokenAddress) {
                    continue
                }

                const tokenInDb = await this.tokenService.findByAddress(tokenAddress, currentBlockchain)

                if (tokenInDb) {
                    continue
                }

                let website: string = ''
                const otherLinks: string[] = []

                for (const linkElement of linkElements) {
                    if ('A' !== linkElement.tagName) {
                        continue
                    }

                    const hrefAttr = linkElement.getAttribute('href')

                    if (!hrefAttr) {
                        continue
                    }

                    if (linkElement.innerHTML.toLowerCase().includes('website')) {
                        website = hrefAttr

                        continue
                    }

                    otherLinks.push(hrefAttr)
                }

                if ('' === website) {
                    continue
                }

                await this.tokenService.add(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    otherLinks,
                    this.workerName,
                    currentBlockchain
                )

                logger.info(
                    `${this.prefixLog} Added to DB:`,
                    tokenAddress,
                    tokenName,
                    website,
                    otherLinks,
                    this.workerName,
                    currentBlockchain
                )
            }

            page += 1
        } while (results > 0)

        logger.info(`${this.prefixLog} worker finished`)
    }

    private getTagByBlockchain(currentBlockchain: Blockchain): string|null {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return 'binance-smart-chain'

            case Blockchain.ETH:
                return 'ethereum'

            case Blockchain.CRO:
                return 'cronos'

            default:
                return null
        }
    }

    private getCoinInfoDiv(coinInfoDOM: DOMWindow): Element {
        return coinInfoDOM
            .document
            .getElementsByClassName('coin-info')[0]
    }

    private findTokenAddress(coinInfoDiv: Element, currentBlockchain: Blockchain): string|null {
        const coinInfoStr = coinInfoDiv.innerHTML

        let tokenAddress = findContractAddress(coinInfoStr)

        if (currentBlockchain === Blockchain.BSC &&
            !coinInfoStr.includes('BSC</strong>') &&
            !coinInfoStr.includes('BNB</strong>')
        ) {
            tokenAddress = null
        }

        if (currentBlockchain === Blockchain.ETH &&
            !coinInfoStr.includes('ETH</strong>')
        ) {
            tokenAddress = null
        }

        return tokenAddress
    }

    private getCoinInfoPagePath(coin: string): string {
        return coin
            .replace('""', '')
            .replace('href=', '')
            .replace(/"/g, '')
    }
}
