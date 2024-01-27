import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiServiceRepository, ApiKeyRepository } from '../repository'
import { MailerService } from '.'
import config from 'config'

export interface RequestOptions {
    serviceName: string;
    headers?: Record<string, string>;
    params?: Record<string, string | number>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    apiKeyLocation?: 'headers' | 'params';
    apiKeyName?: string;
}

export class ApiServiceHandler<T> {
    private readonly serviceRepository: ApiServiceRepository
    private readonly apiKeyRepository: ApiKeyRepository
    private readonly emailService: MailerService

    public constructor(
        serviceRepository: ApiServiceRepository,
        apiKeyRepository: ApiKeyRepository,
        emailService: MailerService
    ) {
        this.serviceRepository = serviceRepository
        this.apiKeyRepository = apiKeyRepository
        this.emailService = emailService
    }

    public async makeServiceRequests(
        axiosInstance: AxiosInstance,
        url: string, options:
            RequestOptions
    ): Promise<T> {
        const {
            serviceName,
            headers = {},
            params = {},
            method = 'GET',
            apiKeyLocation = 'headers',
            apiKeyName = 'X-API-KEY',
        } = options

        let retries = 1
        const maxRetries = 3
        const retryDelay = 1000 // 1 second delay between retries
        const email: string = config.get('email_daily_statistic')

        while (retries <= maxRetries) {
            let service = await this.serviceRepository.findByName(serviceName)

            if (!service) {
                service = await this.serviceRepository.save({ name: serviceName })
                throw new Error(`Service not found. Service name: ${serviceName}`)
            }

            const apiKeyRecord = await this.apiKeyRepository.findAvailableKey(service.id)

            if (apiKeyRecord) {
                const apiKey = apiKeyRecord.apiKey
                const requestConfig: AxiosRequestConfig = {
                    url,
                    method,
                    headers: {
                        ...headers,
                        ['headers' === apiKeyLocation ? apiKeyName : 'X-API-KEY']: apiKey,
                    },
                    params: 'params' === apiKeyLocation ? { ...params, [apiKeyName]: apiKey } : params,
                }

                try {
                    const response: AxiosResponse<T> = await axiosInstance(requestConfig)
                    return response.data
                } catch (error) {
                    await this.apiKeyRepository.updateNextAttemptDate(apiKeyRecord.id, new Date())
                    retries++
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                }
            } else {
                await this.emailService.sendEmail(
                    email,
                    'API keys exhausted',
                    `Service name: ${serviceName}`
                )
                throw new Error('All API keys have been exhausted, and the request failed.')
            }
        }

        await this.emailService.sendEmail(
            email,
            'API keys exhausted after retries',
            `Service name: ${serviceName}`
        )
        throw new Error('All API keys have been exhausted, and the request failed after maximum retries.')
    }
}
