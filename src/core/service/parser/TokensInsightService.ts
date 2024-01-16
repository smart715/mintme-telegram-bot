import axios, { AxiosInstance } from 'axios'
import { singleton, inject } from 'tsyringe'
import { makeServiceRequest, RequestOptions } from '../ApiService'
import { TokensInsightAllCoinsResponse, TokensInsightCoinDataResponse } from '../../types'
import { ApiKeyRepository, ServiceRepository } from '../../repository'

@singleton()
export class TokensInsightService {
    private readonly serviceName: string = 'tokensinsight'

    private readonly axiosInstance: AxiosInstance
    private readonly requestOptions: RequestOptions

    public constructor(
        @inject(ServiceRepository) private readonly serviceRepository: ServiceRepository,
        @inject(ApiKeyRepository) private readonly apiKeyRepository: ApiKeyRepository
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

        return makeServiceRequest<TokensInsightAllCoinsResponse>(
            this.axiosInstance,
            '/coins/list',
            { ...this.requestOptions, serviceName: this.serviceName },
            this.serviceRepository,
            this.apiKeyRepository
        )
    }

    public async getCoinData(id: string): Promise<TokensInsightCoinDataResponse> {
        return makeServiceRequest<TokensInsightCoinDataResponse>(
            this.axiosInstance,
            `/coins/${id}`,
            { ...this.requestOptions, serviceName: this.serviceName },
            this.serviceRepository,
            this.apiKeyRepository
        )
    }
}
