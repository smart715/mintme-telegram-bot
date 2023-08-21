import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { ParserWorkersService, TokensService } from '../../service'
import { Blockchain, logger, sleep } from '../../../utils'

@singleton()
export class CoinsHunterWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinsHunter'
    private readonly prefixLog = `[${this.workerName}]`

    public constructor(
        private readonly parserWorkersService: ParserWorkersService,
        private readonly tokenService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        logger.info(`${this.prefixLog} Worker started`)

        let page = 1

        // eslint-disable-next-line
        while (true) {
            const tokens = await this.parserWorkersService.loadCoinHunterCoins(currentBlockchain, page)

            if (!tokens || !tokens.length) {
                logger.info(`${this.prefixLog} On page ${page} no tokens fount. Finishing`)

                break
            }

            for (const token of tokens) {
                if (!token.address || '0xnone' === token.address.trim() || !token.address.trim().startsWith('0x')) {
                    logger.warn(`${this.prefixLog} No address for ${token.name}. Skipping`)

                    continue
                }

                if (await this.tokenService.findByAddress(token.address, currentBlockchain)) {
                    logger.warn(`${this.prefixLog} Token ${token.name} :: ${token.address} already added. Skipping`)

                    continue
                }

                const tokenAddress = token.address
                const tokenName = `${token.name}(${token.symbol})`
                const website = token.social_info.website
                const links = [ ...Object.values(token.social_info), ...Object.values(token.contact_info) ]

                await this.tokenService.add(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    currentBlockchain,
                )

                logger.info(
                    `${this.prefixLog} Token saved to database:`,
                    tokenAddress,
                    tokenName,
                    website,
                    this.workerName,
                    currentBlockchain
                )
            }

            page++

            await sleep(2000)
        }
        logger.info(`${this.prefixLog} worker finished`)
    }
}
