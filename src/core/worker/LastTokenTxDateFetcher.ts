import { TokensService } from '../service'
import { Blockchain, explorerApiUrls, sleep } from '../../utils'
import { Token } from '../entity'
import axios from 'axios'
import config from 'config'
import { Logger } from 'winston'

interface ExplorerApiKeysInterface {
    [Blockchain.BSC]: string[];
    [Blockchain.ETH]: string[];
    [Blockchain.CRO]: string[];
    [Blockchain.MATIC]: string[];
    [Blockchain.SOL]: string[];
}

export class LastTokenTxDateFetcher {
    private readonly workerName = LastTokenTxDateFetcher.name
    private readonly noTokensSleepTime = 60 * 1000
    private readonly sleepTimeBetweenTokens = 1000
    private readonly explorerApiKeys: ExplorerApiKeysInterface = config.get('explorerApiKeys')
    private readonly defaultTxTimestamp = 962083822000

    public constructor(
        private readonly tokensService: TokensService,
        private readonly logger: Logger,
    ) { }

    public async run(): Promise<void> {
        this.logger.info(`[${this.workerName}] Started`)

        // eslint-disable-next-line
        while (true) {
            const token = await this.tokensService.getNextWithoutTxDate()

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
        const apiKeys = this.explorerApiKeys[blockchain]

        for (let apiKeyIndex = 0; apiKeyIndex < apiKeys.length; apiKeyIndex++) {
            const apiKey = apiKeys[apiKeyIndex]

            try {
                const response = await axios.get(this.buildLastTxUrl(tokenAddress, blockchain, apiKey))

                return response.data.result[0] && response.data.result[0].timeStamp
                    ? parseInt(response.data.result[0].timeStamp) * 1000
                    : null
            } catch (error:any) {
                this.logger.error(`[${this.workerName}] Error with API key ${apiKey}: ${error.message}`)
            }
        }

        throw new Error(`[${this.workerName}] All API keys have been exhausted, and the request failed.`)
    }

    private buildLastTxUrl(tokenAddress: string, blockchain: Blockchain, apiKey: string): string {
        const explorerApiUrl = explorerApiUrls[blockchain]
        return `https://${explorerApiUrl}/api?apikey=${apiKey}&module=account&action=txlist&page=1&sort=desc&offset=1&address=${tokenAddress}`
    }
}
