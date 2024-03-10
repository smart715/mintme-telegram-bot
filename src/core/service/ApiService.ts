import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiServiceRepository, ApiKeyRepository } from '../repository'
import { MailerService } from '..'
import config from 'config'
import { singleton } from 'tsyringe'
import { sleep } from '../../utils'
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
        const email: string = config.get('email_daily_statistic')

        let service = await this.apiServiceRepository.findByName(serviceName)

        if (!service) {
            service = await this.apiServiceRepository.save({ name: serviceName })
            throw new Error(`Service not found. Service name: ${serviceName}`)
        }

        const apiKeys = await this.apiKeyRepository.findAllAvailableKeys(service.id)

        if (0 === apiKeys.length) {
            await this.mailerService.sendEmail(
                email,
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
                await this.apiKeyRepository.updateNextAttemptDate(apiKeyRecord.id, new Date())
                await this.apiKeyRepository.incrementFailureCount(apiKeyRecord.id)
                await this.checkAndDisableKey(apiKeyRecord)

                await sleep(1000)
            }
        }

        await this.mailerService.sendEmail(
            email,
            'API keys exhausted',
            `Service name: ${serviceName}`
        )
        throw new Error('All API keys have been exhausted, and the request failed.')
    }

    public async checkAndDisableKey(apiKeyRecord: ApiKey): Promise<void> {
        const consecutiveFailures = apiKeyRecord.failureCount
        // Maximum consecutive failures allowed before considering disabling the API key
        const maxConsecutiveFailures = 3

        if (consecutiveFailures >= maxConsecutiveFailures) {
            const resetLimitReached = await this.isResetLimitReached(apiKeyRecord)
            if (resetLimitReached) {
                await this.apiKeyRepository.updateApiKeyDisabledStatus(apiKeyRecord.id, true)
            }
        }
    }

    public async isResetLimitReached(apiKeyRecord: ApiKey): Promise<boolean> {
        // Logic to check if the reset limit (1 month) is reached since the last attempt
        const lastAttemptDate = apiKeyRecord.nextAttemptDate
        if (!lastAttemptDate) {
            return false
        }

        const currentDate = new Date()
        const resetLimitDate = new Date(lastAttemptDate)
        resetLimitDate.setMonth(resetLimitDate.getMonth() + 1) // Add 1 month

        return currentDate >= resetLimitDate
    }
}
