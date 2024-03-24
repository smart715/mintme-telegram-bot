import { DOMWindow, JSDOM } from 'jsdom'
import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain, findContractAddress } from '../../../utils'
import { CheckedTokenService, CoinBuddyService, TokensService } from '../../service'
import { AbstractParserWorker } from './AbstractParserWorker'

@singleton()
export class CoinBuddyWorker extends AbstractParserWorker {
    private readonly workerName = 'CoinBuddy'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] = [
        Blockchain.ETH,
        Blockchain.BSC,
        Blockchain.CRO,
        Blockchain.MATIC,
        Blockchain.SOL,
        Blockchain.ARB,
        Blockchain.AVAX,
    ]

    public constructor(
        private readonly coinBuddyService: CoinBuddyService,
        private readonly tokenService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started`)

        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }

        this.logger.info(`${this.prefixLog} Worker finished`)
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} Checking ${currentBlockchain} blockchain`)

        const tag = this.getTagByBlockchain(currentBlockchain)

        if (null === tag) {
            this.logger.error(`${this.prefixLog} Tag for ${currentBlockchain} doesn't exists. Pls specify it in code. Aborting`)

            return
        }

        let page = 1
        let results = 50

        do {
            this.logger.info(`${this.prefixLog} Page start ${page}`)

            let coinsSrc = ''
            try {
                coinsSrc = await this.coinBuddyService.getAllCoins(tag, page)
            } catch (ex: any) {
                this.logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all coins. Tag: ${tag}. Page: ${page}. Reason: ${ex.message}`
                )

                return
            }

            if ('' === coinsSrc) {
                this.logger.error(`${this.prefixLog} Aborting. Response for all coins returns empty string. Tag: ${tag}. Page: ${page}`)

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
                    this.logger.error(
                        `${this.prefixLog} Aborting. Failed to fetch coin info. Tag: ${tag}. Page: ${page}. Reason: ${ex.message}`
                    )

                    return
                }

                const coinId = path.replace('/coins/', '')

                this.logger.info(`${this.prefixLog} Checking coin: ${coinId}`)

                if ('' === coinInfo) {
                    this.logger.info(`${this.prefixLog} Empty response for ${coinId}. Skipping`)

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

                if (await this.checkedTokenService.isChecked(coinId, this.workerName)) {
                    this.logger.warn(`${this.prefixLog} ${coinId} already checked. Skipping`)

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

                await this.tokenService.addOrUpdateToken(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    otherLinks,
                    this.workerName,
                    currentBlockchain,
                    this.logger
                )

                await this.checkedTokenService.saveAsChecked(coinId, this.workerName)

                this.logger.info(
                    `${this.prefixLog} Added to DB:`,
                    [
                        tokenAddress,
                        tokenName,
                        website,
                        otherLinks,
                        this.workerName,
                        currentBlockchain,
                    ]
                )
            }

            page += 1
        } while (results > 0)
    }

    private getTagByBlockchain(currentBlockchain: Blockchain): string|null {
        switch (currentBlockchain) {
            case Blockchain.BSC:
                return 'binance-smart-chain'
            case Blockchain.ETH:
                return 'ethereum'
            case Blockchain.CRO:
                return 'cronos'
            case Blockchain.MATIC:
                return 'polygon'
            case Blockchain.SOL:
                return 'solana'
            case Blockchain.AVAX:
                return 'avalanche'
            case Blockchain.ARB:
                return 'arbitrum'
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
