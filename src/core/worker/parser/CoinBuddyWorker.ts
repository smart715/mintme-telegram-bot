import { JSDOM } from 'jsdom'
import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { Blockchain, logger } from '../../../utils'
import { CoinBuddyService, TokensService } from '../../service'

@singleton()
export class CoinBuddyWorker extends AbstractTokenWorker{
    private readonly prefixLog = '[CoinBuddy]'
    private readonly unsupportedBlockchain = [ ]

    public constructor(
        private readonly coinBuddyService: CoinBuddyService,
        private readonly tokenService: TokensService
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<any> {
        logger.info(`${this.prefixLog} Worker started`)

        if (this.unsupportedBlockchain.includes(currentBlockchain)) {
            logger.error(`${this.prefixLog} Unsupported blockchain ${currentBlockchain}. Aborting`)

            return
        }

        const tag = this.getTagByBlockchain(currentBlockchain)

        if (null === tag) {
            logger.error(`Tag for ${currentBlockchain} doesn't exists. Pls specify it in code. Aborting`)

            return
        }

        let page = 1
        let results = 50

        do {
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
                logger.error(`${this.prefixLog} Aborting. Response for all coins returns emppty string. Tag: ${tag}. Page: ${page}`)

                return
            }

            let coins = coinsSrc
                .replace('href="\/coins\/new_coins"', '')
                .match(/href="\/coins\/(.+?)"/g)

            if (null === coins) {
                results = 0

                continue
            }

            results = coins.length

            for (const coin of coins) {
                const path = coin
                    .replace('""', '')
                    .replace('href=', '')

                let coinInfo = ''
                try {
                    coinInfo = await this.coinBuddyService.getCoinInfo(path)
                } catch (ex: any) {
                    logger.error(
                        `${this.prefixLog} Aborting. Failed to fetch all coins. Tag: ${tag}. Page: ${page}. Reason: ${ex.message}`
                    )

                    return
                }

                const coinId = path.replace('\/coins\/', '')

                logger.info(`Checking coin: ${coinId}`)

                if ('' === coinInfo) {
                    logger.info(`Empty response for ${coinId}. Skipping`)

                    continue
                }

                const coinInfoDOM = (new JSDOM(coinInfo)).window

                const tokenName = coinInfoDOM.document.title
            }

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

            default:
                return null
        }
    }
}
