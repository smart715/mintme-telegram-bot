import { singleton } from 'tsyringe'
import { CoinsHunterService, NewestCheckedTokenService, TokensService } from '../../service'
import { Blockchain, sleep } from '../../../utils'
import { Logger } from 'winston'
import { NewestTokenChecker, StopCheckException } from './NewestTokenChecker'

@singleton()
export class CoinsHunterWorker extends NewestTokenChecker {
    protected readonly workerName = 'CoinsHunter'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains = Object.values(Blockchain)

    protected override readonly sleepTimeBetweenPages = 2 * 1000

    public constructor(
        private readonly coinsHunterService: CoinsHunterService,
        private readonly tokenService: TokensService,
        protected readonly newestTokenCheckedService: NewestCheckedTokenService,
        protected readonly logger: Logger,
    ) {
        super(
            CoinsHunterWorker.name,
            newestTokenCheckedService,
            logger
        )
    }

    public override async run(): Promise<void> {
        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(blockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} Worker started for ${blockchain} blockchain`)

        this.newestChecked = await this.getNewestChecked(blockchain)
        this.needToSaveNextNewestChecked = true
        let page = 1

        try {
            while (true) { // eslint-disable-line
                this.logger.info(`${this.prefixLog} Checking page: ${page}`)

                await this.checkPage(page, blockchain)
                await sleep(this.sleepTimeBetweenPages)

                page += 1
            }
        } catch (error: any) {
            if (error instanceof StopCheckException) {
                this.logger.info(`${this.prefixLog} ${error.message}`)
            } else {
                this.logger.error(`${this.prefixLog} ${error.message}`)

                throw error
            }
        } finally {
            this.logger.info(`${this.prefixLog} Finished`)
        }
    }

    protected override async checkPage(page: number, blockchain?: Blockchain): Promise<void> {
        const tokens = await this.coinsHunterService.loadCoins(blockchain!, page)

        if (!tokens || !tokens.length) {
            throw new StopCheckException(`${this.prefixLog} On page ${page} no tokens found. Finishing`)
        }

        for (const token of tokens) {
            await this.newestCheckedCheck(token.coin_id, blockchain)

            if (!token.address || '0xnone' === token.address.trim() || !token.address.trim().startsWith('0x')) {
                this.logger.warn(`${this.prefixLog} No address for ${token.name}. Skipping`)

                continue
            }

            const tokenAddress = token.address
            const tokenName = `${token.name}(${token.symbol})`
            const website = token.social_info.website
            const links = [ ...Object.values(token.social_info), ...Object.values(token.contact_info) ]

            await this.tokenService.addOrUpdateToken(
                tokenAddress,
                tokenName,
                [ website ],
                [ '' ],
                links,
                this.workerName,
                blockchain!,
            )

            this.logger.info(
                `${this.prefixLog} Token saved to database:`,
                [ tokenAddress, tokenName, blockchain ],
            )
        }
    }
}
