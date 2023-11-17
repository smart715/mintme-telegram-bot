// CMCService.ts

import { AxiosInstance } from 'axios'
import { singleton } from 'tsyringe'
import config from 'config'
import { CMCApiGeneralResponse, CMCCryptocurrency, CMCTokenInfoResponse, CMCWorkerConfig } from '../../types'
import { makeRequest, RequestOptions } from '../ApiService'

@singleton()
export class CMCService {
    private readonly apiKeys: string[] = config.get<CMCWorkerConfig>('cmcWorker')['apiKeys']
    private readonly axiosInstance: AxiosInstance

    public constructor(axiosInstance: AxiosInstance) {
        this.axiosInstance = axiosInstance
    }

    public async getLastTokens(start: number, limit: number): Promise<CMCApiGeneralResponse<CMCCryptocurrency[]>> {
        const requestOptions: RequestOptions = {
            apiKeys: this.apiKeys,
            method: 'GET',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            params: {
                start: start.toString(),
                limit: limit.toString(),
                sort: 'id',
            },
            apiKeyLocation: 'params',
            apiKeyName: 'CMC_PRO_API_KEY',
        }

        return makeRequest<CMCApiGeneralResponse<CMCCryptocurrency[]>>(this.axiosInstance, 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', requestOptions)
    }

    public async getTokenInfo(slug: string): Promise<CMCApiGeneralResponse<CMCTokenInfoResponse>> {
        const requestOptions: RequestOptions = {
            apiKeys: this.apiKeys,
            method: 'GET',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            params: {
                slug,
                aux: 'urls,platform',
            },
            apiKeyLocation: 'params',
            apiKeyName: 'CMC_PRO_API_KEY',
        }

        return makeRequest<CMCApiGeneralResponse<CMCTokenInfoResponse>>(this.axiosInstance, 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info', requestOptions)
    }
}
