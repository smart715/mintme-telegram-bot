import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiServiceRepository, ApiKeyRepository } from '../repository'
import { MailerService } from '..'
import config from 'config'
import { singleton } from 'tsyringe'
import { ApiKey } from '../entity'

export interface RequestOptions {
    serviceName: string;
    headers?: Record<string, string>;
    params?: Record<string, string | number>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    apiKeyLocation?: 'headers' | 'params';
    apiKeyName?: string;
}

@singleton()
export class ApiService {
    private readonly email: string = config.get('email_daily_statistic')
    private readonly failureCountDelays: number[] = config.get('failure_count_delays')

    public constructor(
        private readonly apiServiceRepository: ApiServiceRepository,
        private readonly apiKeyRepository: ApiKeyRepository,
        private readonly mailerService: MailerService
    ) { }

    public async makeServiceRequests(
        axiosInstance: AxiosInstance,
        url: string,
        options: RequestOptions
    ): Promise<any> {
        const { serviceName, headers = {}, params = {}, method = 'GET', apiKeyLocation = 'headers', apiKeyName = 'X-API-KEY' } = options
        let service = await this.apiServiceRepository.findByName(serviceName)

        if (!service) {
            service = await this.apiServiceRepository.save({ name: serviceName })
            throw new Error(`Service not found. Service name: ${serviceName}`)
        }

        const apiKeys = await this.apiKeyRepository.findAllAvailableKeys(service.id)

        if (0 === apiKeys.length) {
            await this.mailerService.sendEmail(
                this.email,
                'API keys exhausted',
                `Service name: ${serviceName}`
            )
            throw new Error('No API keys are available for the service.')
        }

        for (const apiKeyRecord of apiKeys) {
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
                const response: AxiosResponse<any> = await axiosInstance(requestConfig)
                return response.data
            } catch (error) {
                await this.apiKeyRepository.incrementFailureCount(apiKeyRecord.id)
                await this.updateNextAttemptDate(apiKeyRecord)
            }
        }

        await this.mailerService.sendEmail(
            this.email,
            'API keys exhausted',
            `Service name: ${serviceName}`
        )
        throw new Error('All API keys have been exhausted, and the request failed.')
    }

    public async updateNextAttemptDate(apiKeyRecord: ApiKey): Promise<void> {
        const failureCount = apiKeyRecord.failureCount
        const delayIndex = Math.min(failureCount, this.failureCountDelays.length - 1)
        const delay = this.failureCountDelays[delayIndex]

        const nextAttemptDate = new Date()
        nextAttemptDate.setDate(nextAttemptDate.getDate() + delay)

        await this.apiKeyRepository.updateNextAttemptDate(apiKeyRecord.id, nextAttemptDate)
    }
}
