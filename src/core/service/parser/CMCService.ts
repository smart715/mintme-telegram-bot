import axios from 'axios'
import { singleton } from 'tsyringe'
import config from 'config'
import { CMCApiGeneralResponse, CMCCryptocurrency, CMCTokenInfoResponse, CMCWorkerConfig } from '../../types'

@singleton()
export class CMCService {
    private readonly apiKeys: string[] = config.get<CMCWorkerConfig>('cmcWorker')['apiKeys']
    private currentApiKeyIndex: number = 0

    public async getLastTokens(start: number, limit: number): Promise<CMCApiGeneralResponse<CMCCryptocurrency[]>> {
        for (let i = 0; i < this.apiKeys.length; i++) {
            const apiKey = this.apiKeys[this.currentApiKeyIndex]

            try {
                const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
                    params: {
                        CMC_PRO_API_KEY: apiKey,
                        start,
                        limit,
                        sort: 'id',
                    },
                })

                return response.data
            } catch (error) {
                if (i < this.apiKeys.length - 1) {
                    // If this key fails, move to the next key and retry
                    this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length
                } else {
                    throw error
                }
            }
        }

        // Handle the case where all keys are exhausted or other errors occur
        throw new Error('All API keys have been exhausted, and the request failed.')
    }

    public async getTokenInfo(slug: string): Promise<CMCApiGeneralResponse<CMCTokenInfoResponse>> {
        for (let i = 0; i < this.apiKeys.length; i++) {
            const apiKey = this.apiKeys[this.currentApiKeyIndex]

            try {
                const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/info', {
                    params: {
                        CMC_PRO_API_KEY: apiKey,
                        slug,
                        aux: 'urls,platform',
                    },
                })

                return response.data
            } catch (error) {
                if (i < this.apiKeys.length - 1) {
                    // If this key fails, move to the next key and retry
                    this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length
                } else {
                    throw error
                }
            }
        }

        // Handle the case where all keys are exhausted or other errors occur
        throw new Error('All API keys have been exhausted, and the request failed.')
    }
}
