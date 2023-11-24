/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios'
import config from 'config'
import { singleton } from 'tsyringe'
import { makeRequest, RequestOptions } from '../ApiService'
import { TokensInsightAllCoinsResponse, TokensInsightCoinDataResponse } from '../../types'

@singleton()
export class TokensInsightService {
    private readonly apiKeys: string[] = config.get('tokensinsight_api_keys') as string[]

    private readonly requestOptions: RequestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        apiKeyLocation: 'headers',
        apiKeyName: 'TI_API_KEY',
    }

    public async getAllCoins(offset: number, limit: number): Promise<TokensInsightAllCoinsResponse> {
        this.requestOptions.params = { offset, limit }

        return makeRequest<TokensInsightAllCoinsResponse>(
            axios,
            'https://api.tokeninsight.com/api/v1/coins/list',
            { ...this.requestOptions, apiKeys: this.apiKeys }
        )
    }

    public async getCoinData(id: string): Promise<TokensInsightCoinDataResponse> {
        return makeRequest<TokensInsightCoinDataResponse>(
            axios,
            `https://api.tokeninsight.com/api/v1/coins/${id}`,
            { ...this.requestOptions, apiKeys: this.apiKeys }
        )
    }
}
