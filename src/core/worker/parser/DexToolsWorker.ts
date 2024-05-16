import { singleton } from 'tsyringe'
import { Blockchain, sleep } from '../../../utils'
import { ApiService, CheckedTokenService, TokensService } from '../../service'
import { Logger } from 'winston'
import { AbstractParserWorker } from './AbstractParserWorker'
import axios from 'axios'
import moment from 'moment'
import { DexToolsAllTokensResponse, DexToolsTokenInfo } from '../../types'

@singleton()
export class DexToolsWorker extends AbstractParserWorker {
    private readonly workerName = DexToolsWorker.name
    private readonly supportedBlockchains = [
        Blockchain.SOL,
        Blockchain.BASE,
        Blockchain.ETH,
        Blockchain.ARB,
        Blockchain.AVAX,
        Blockchain.BSC,
        Blockchain.CRO,
        Blockchain.MATIC,
    ]

    private readonly daysPerRequest = 1
    private readonly skipBcAfterEmptyContinousRequests = 30
    private readonly firstSocialInfoFound = moment('2022-05-01T00:00:00')

    public constructor(
        private readonly tokensService: TokensService,
        private readonly checkedTokenService: CheckedTokenService,
        private readonly apiService: ApiService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        this.logger.info(`[${this.workerName}] Started`)

        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }

        this.logger.info(`[${this.workerName}] Finished`)
    }

    private async runByBlockchain(blockchain: Blockchain): Promise<void> {
        this.logger.info(`[${this.workerName}] Blockchain: ${blockchain}`)

        let keepFetching = true
        const to = moment().utc().endOf('day')
        const from = moment().utc().subtract(this.daysPerRequest, 'day').endOf('day')
        let page = 0
        let pagesCount = 10
        let continousEmptyRequests = 0

        while (keepFetching) {
            const searchRequestId = `${blockchain}-${to.format('YYYYMMDD')}`
            const isCheckedRange = await this.checkedTokenService.isChecked(
                searchRequestId,
                this.workerName
            )

            if (isCheckedRange) {
                pagesCount = 0
            }

            while (page < pagesCount) {
                this.logger.info(`From: ${from.toISOString()}: ${to.toISOString()} | page: ${page}/${pagesCount}`)
                const tokensResponse = await this.getTokens(blockchain, from.toISOString(), to.toISOString(), page)
                pagesCount = tokensResponse.totalPages

                await sleep(2000)

                for (const token of tokensResponse.tokens) {
                    continousEmptyRequests = 0

                    await this.addToken(token, blockchain)
                }

                if (!tokensResponse.tokens.length) {
                    continousEmptyRequests++
                }

                this.logger.info(`Finished From: ${from.toISOString()}: ${to.toISOString()} | page: ${page}`)
                page++
            }

            if (!isCheckedRange && !moment().utc().endOf('day').isSame(to)) {
                await this.checkedTokenService.saveAsChecked(searchRequestId, this.workerName)
            }

            to.subtract(this.daysPerRequest, 'day')
            from.subtract(this.daysPerRequest, 'day')
            page = 0
            pagesCount = 10

            keepFetching = this.skipBcAfterEmptyContinousRequests <= continousEmptyRequests
                ? false
                :!this.firstSocialInfoFound.isAfter(to)
        }
    }

    private async addToken(token: DexToolsTokenInfo, blockchain: Blockchain): Promise<void> {
        const links = []

        for (const link of Object.values(token.socialInfo)) {
            if (link.trim().length > 0) {
                links.push(link)
            }
        }

        await this.tokensService.addOrUpdateToken(
            token.address,
            `${token.name}(${token.symbol})`,
            [ token.socialInfo['website'] ],
            [ token.socialInfo['email'] ],
            links,
            this.workerName,
            blockchain,
            this.logger
        )
    }

    private async getTokens(
        blockchain: Blockchain,
        from: string, to: string,
        page: number
    ): Promise<DexToolsAllTokensResponse> {
        const response = await this.apiService.makeServiceRequests(
            axios.create({
                baseURL: `https://public-api.dextools.io/trial/v2/token/${this.getChainParam(blockchain)}`,
                params: {
                    sort: 'socialsInfoUpdated',
                    order: 'desc',
                    from: from,
                    to: to,
                    page: page,
                    pageSize: 50,
                },
            }),
            '',
            {
                serviceName: this.workerName,
                method: 'GET',
                apiKeyLocation: 'headers',
            })

        return response.data
    }

    private getChainParam(bc: Blockchain): string {
        switch (bc) {
            case Blockchain.ETH:
                return 'ether'
            case Blockchain.SOL:
                return 'solana'
            case Blockchain.BSC:
                return 'bnb'
            case Blockchain.ARB:
                return 'arbitrum'
            case Blockchain.AVAX:
                return 'avalanche'
            case Blockchain.BASE:
                return 'base'
            case Blockchain.CRO:
                return 'cronos'
            case Blockchain.MATIC:
                return 'polygon'
        }
    }
}
