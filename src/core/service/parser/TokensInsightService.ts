/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios'
import config from 'config'
import { singleton } from 'tsyringe'
import { TokensInsightAllCoinsResponse, TokensInsightCoinDataResponse } from '../../types'

@singleton()
export class TokensInsightService {
    private readonly apiKeys: string[] = config.get('tokensinsight_api_keys') as string[]
    private currentApiKeyIndex: number = 0

    public async getAllCoins(offset: number, limit: number): Promise<TokensInsightAllCoinsResponse> {
        for (let i = 0; i < this.apiKeys.length; i++) {
            const apiKey = this.apiKeys[this.currentApiKeyIndex]
            const headers = {
                'Content-Type': 'application/json',
                'TI_API_KEY': apiKey,
            }

            try {
                const response = await axios.get(
                    'https://api.tokeninsight.com/api/v1/coins/list',
                    {
                        headers: headers,
                        params: {
                            offset,
                            limit,
                        },
                    },
                )

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

    public async getCoinData(id: string): Promise<TokensInsightCoinDataResponse> {
        for (let i = 0; i < this.apiKeys.length; i++) {
            const apiKey = this.apiKeys[this.currentApiKeyIndex]
            const headers = {
                'Content-Type': 'application/json',
                'TI_API_KEY': apiKey,
            }

            try {
                const response = await axios.get(
                    `https://api.tokeninsight.com/api/v1/coins/${id}`,
                    {
                        headers: headers,
                    },
                )

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
