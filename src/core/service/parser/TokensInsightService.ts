import axios, { AxiosInstance } from 'axios'
import { singleton, inject } from 'tsyringe'
import { ApiServiceHandler, RequestOptions } from '../ApiServiceHandler'
import { TokensInsightAllCoinsResponse, TokensInsightCoinDataResponse } from '../../types'

@singleton()
export class TokensInsightService {
    private readonly serviceName: string = 'tokensinsight'

    private readonly axiosInstance: AxiosInstance
    private readonly requestOptions: RequestOptions

    public constructor(
        @inject(ApiServiceHandler)
        private readonly apiServiceHandler: ApiServiceHandler<
            TokensInsightAllCoinsResponse | TokensInsightCoinDataResponse
        >
    ) {
        this.axiosInstance = axios.create({
            baseURL: 'https://api.tokeninsight.com/api/v1',
            timeout: 5000,
        })

        this.requestOptions = {
            serviceName: this.serviceName,
            method: 'GET',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            apiKeyLocation: 'headers',
            apiKeyName: 'TI_API_KEY',
        }
    }

    public async getAllCoins(offset: number, limit: number): Promise<TokensInsightAllCoinsResponse> {
        this.requestOptions.params = { offset, limit }

        return this.apiServiceHandler.makeServiceRequests(
            this.axiosInstance,
            '/coins/list',
            this.requestOptions
        )
    }

    public async getCoinData(id: string): Promise<TokensInsightCoinDataResponse> {
        return this.apiServiceHandler.makeServiceRequests(
            this.axiosInstance,
            `/coins/${id}`,
            this.requestOptions
        )
    }
}
