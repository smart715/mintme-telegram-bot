import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { CoinsHunterService, NewestCheckedTokenService, TokensService } from '../../service'
import { Blockchain, sleep } from '../../../utils'
import { Logger } from 'winston'

@singleton()
export class CoinsHunterWorker extends AbstractTokenWorker {
    private readonly workerName = 'CoinsHunter'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains = Object.values(Blockchain)

    public constructor(
        private readonly coinsHunterService: CoinsHunterService,
        private readonly tokenService: TokensService,
        private readonly newestTokenCheckedService: NewestCheckedTokenService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started for ${currentBlockchain} blockchain`)

        const newestChecked = await this.newestTokenCheckedService.findOne(this.workerName, currentBlockchain)
        let page = 1

        let firstChecked = null
        let parsingCompleted = false
        while (!parsingCompleted) { // eslint-disable-line
            const tokens = await this.coinsHunterService.loadCoins(currentBlockchain, page)

            if (!tokens || !tokens.length) {
                this.logger.info(`${this.prefixLog} On page ${page} no tokens found. Finishing`)

                parsingCompleted = true

                break
            }

            for (const token of tokens) {
                if (!firstChecked) {
                    firstChecked = token.coin_id
                }

                if (newestChecked && newestChecked.tokenId === token.coin_id) {
                    parsingCompleted = true

                    this.logger.warn(`${this.prefixLog} Reached newest checked (${token.coin_id}). Breaking`)

                    break
                }

                if (!token.address || '0xnone' === token.address.trim() || !token.address.trim().startsWith('0x')) {
                    this.logger.warn(`${this.prefixLog} No address for ${token.name}. Skipping`)

                    continue
                }

                const tokenAddress = token.address
                const tokenName = `${token.name}(${token.symbol})`
                const website = token.social_info.website
                const links = [ ...Object.values(token.social_info), ...Object.values(token.contact_info) ]

                await this.tokenService.addIfNotExists(
                    tokenAddress,
                    tokenName,
                    [ website ],
                    [ '' ],
                    links,
                    this.workerName,
                    currentBlockchain,
                )

                this.logger.info(
                    `${this.prefixLog} Token saved to database:`,
                    [ tokenAddress, tokenName, currentBlockchain ],
                )
            }

            page++

            await sleep(2000)
        }

        if (parsingCompleted && firstChecked) {
            this.newestTokenCheckedService.save(this.workerName, firstChecked, currentBlockchain)

            this.logger.warn(`${this.prefixLog} Saved ${firstChecked} as newest checked for ${currentBlockchain}.`)
        }

        this.logger.info(`${this.prefixLog} worker finished for ${currentBlockchain} blockchain`)
    }
}
