import axios, { AxiosInstance } from 'axios'
import { singleton, inject } from 'tsyringe'
import { CMCApiGeneralResponse, CMCCryptocurrency, CMCTokenInfoResponse } from '../../types'
import { makeServiceRequest, RequestOptions } from '../ApiService'
import { ApiKeyRepository, ApiServiceRepository } from '../../repository'
import { MailerService } from '../MailerService'

@singleton()
export class CMCService {
    private readonly serviceName: string = 'cmcWorker'
    private readonly axiosInstance: AxiosInstance

    public constructor(
        @inject(ApiServiceRepository) private readonly serviceRepository: ApiServiceRepository,
        @inject(ApiKeyRepository) private readonly apiKeyRepository: ApiKeyRepository,
        @inject(MailerService) private readonly mailerService: MailerService
    ) {
        this.axiosInstance = axios.create({
            baseURL: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency',
            timeout: 5000,
        })
    }

    public async getLastTokens(start: number, limit: number): Promise<CMCApiGeneralResponse<CMCCryptocurrency[]>> {
        const requestOptions: RequestOptions = {
            serviceName: this.serviceName,
            method: 'GET',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            params: {
                start,
                limit,
                sort: 'id',
            },
            apiKeyLocation: 'params',
            apiKeyName: 'CMC_PRO_API_KEY',
        }

        return makeServiceRequest<CMCApiGeneralResponse<CMCCryptocurrency[]>>(
            this.axiosInstance,
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map',
            requestOptions,
            this.serviceRepository,
            this.apiKeyRepository,
            this.mailerService
        )
    }

    public async getTokenInfo(slug: string): Promise<CMCApiGeneralResponse<CMCTokenInfoResponse>> {
        const requestOptions: RequestOptions = {
            serviceName: this.serviceName,
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

        return makeServiceRequest<CMCApiGeneralResponse<CMCTokenInfoResponse>>(
            this.axiosInstance,
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info',
            requestOptions,
            this.serviceRepository,
            this.apiKeyRepository,
            this.mailerService
        )
    }
}
