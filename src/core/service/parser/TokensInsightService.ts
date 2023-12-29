import axios, { AxiosInstance } from 'axios'
import { singleton } from 'tsyringe'
import { makeServiceRequest, RequestOptions } from '../ApiService'
import { TokensInsightAllCoinsResponse, TokensInsightCoinDataResponse } from '../../types'

@singleton()
export class TokensInsightService {
    private readonly serviceName: string = 'tokensinsight'

    private readonly axiosInstance: AxiosInstance

    public constructor() {
        this.axiosInstance = axios.create({
            baseURL: 'https://api.tokeninsight.com/api/v1',
            timeout: 5000,
        })
    }

    private readonly requestOptions: RequestOptions = {
        serviceName: this.serviceName,
        method: 'GET',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
        },
        apiKeyLocation: 'headers',
        apiKeyName: 'TI_API_KEY',
    }

    public async getAllCoins(offset: number, limit: number): Promise<TokensInsightAllCoinsResponse> {
        this.requestOptions.params = { offset, limit }

        return makeServiceRequest<TokensInsightAllCoinsResponse>(
            this.axiosInstance,
            '/coins/list',
            { ...this.requestOptions, serviceName: this.serviceName }
        )
    }

    public async getCoinData(id: string): Promise<TokensInsightCoinDataResponse> {
        return makeServiceRequest<TokensInsightCoinDataResponse>(
            this.axiosInstance,
            `/coins/${id}`,
            { ...this.requestOptions, serviceName: this.serviceName }
        )
    }
}
