import { TokensService, ApiService } from '../service'
import { Blockchain, explorerApiUrls, sleep } from '../../utils'
import { Token } from '../entity'
import axios from 'axios'
import { Logger } from 'winston'

export class LastTokenTxDateFetcher {
    private readonly workerName = LastTokenTxDateFetcher.name
    private readonly noTokensSleepTime = 60 * 1000
    private readonly sleepTimeBetweenTokens = 1000
    private readonly defaultTxTimestamp = 962083822000

    private readonly supportedBlockchains = [
        Blockchain.ETH,
        Blockchain.BSC,
        Blockchain.CRO,
        Blockchain.MATIC,
    ]

    public constructor(
        private readonly tokensService: TokensService,
        private readonly logger: Logger,
        private readonly apiService: ApiService,
    ) { }

    public async run(): Promise<void> {
        this.logger.info(`[${this.workerName}] Started`)

        // eslint-disable-next-line
        while (true) {
            const token = await this.tokensService.getNextWithoutTxDate(this.supportedBlockchains)

            if (!token) {
                this.logger.info(`[${this.workerName}] No tokens without lastTxDate, sleep`)
                await sleep(this.noTokensSleepTime)

                continue
            }

            await this.processToken(token)
            await sleep(this.sleepTimeBetweenTokens)
        }
    }

    private async processToken(token: Token): Promise<void> {
        this.logger.info(`[${this.workerName}] Getting last tx for ${token.address}: ${token.blockchain}`)

        token.lastTxDate = await this.getLastTxDate(token.address, token.blockchain)
        await this.tokensService.update(token)
    }

    private async getLastTxDate(tokenAddress: string, blockchain: Blockchain): Promise<Date> {
        const lastTxTimestamp = await this.fetchLastTxTimestamp(tokenAddress, blockchain)

        return new Date(lastTxTimestamp ?? this.defaultTxTimestamp)
    }

    private async fetchLastTxTimestamp(tokenAddress: string, blockchain: Blockchain): Promise<number | null> {
        const response = await this.apiService.makeServiceRequests(
            axios.create({
                baseURL: `https://${explorerApiUrls[blockchain]}/api`,
                params: {
                    module: 'account',
                    action: 'txlist',
                    page: 1,
                    sort: 'desc',
                    offset: 1,
                    address: tokenAddress,
                },
            }),
            '',
            {
                serviceName: blockchain,
                method: 'GET',
            })

        return response.data.result[0] && response.data.result[0].timeStamp
            ? parseInt(response.data.result[0].timeStamp) * 1000
            : null
    }
}
