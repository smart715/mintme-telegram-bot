import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiServiceRepository, ApiKeyRepository } from '../repository'
import { MailerService } from '../service'
import config from 'config'

export interface RequestOptions {
    serviceName: string;
    headers?: Record<string, string>;
    params?: Record<string, string | number>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    apiKeyLocation?: 'headers' | 'params';
    apiKeyName?: string;
}

export async function makeServiceRequest<T>(
    axiosInstance: AxiosInstance,
    url: string,
    options: RequestOptions,
    serviceRepository: ApiServiceRepository,
    apiKeyRepository: ApiKeyRepository,
    emailService: MailerService
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
        let service = await serviceRepository.findByName(serviceName)

        if (!service) {
            service = await serviceRepository.save({ name: serviceName })
            throw new Error(`Service not found. Service name: ${serviceName}`)
        }

        const apiKeyRecord = await apiKeyRepository.findAvailableKey(service.id)

        if (apiKeyRecord) {
            const apiKey = apiKeyRecord.apiKey
            const config: AxiosRequestConfig = {
                url,
                method,
                headers: {
                    ...headers,
                    ['headers' === apiKeyLocation ? apiKeyName : 'X-API-KEY']: apiKey,
                },
                params: 'params' === apiKeyLocation ? { ...params, [apiKeyName]: apiKey } : params,
            }

            try {
                const response: AxiosResponse<T> = await axiosInstance(config)
                return response.data
            } catch (error) {
                await apiKeyRepository.updateNextAttemptDate(apiKeyRecord.id, new Date())
                retries++
                await new Promise(resolve => setTimeout(resolve, retryDelay))
            }
        } else {
            await emailService.sendEmail(email, 'API keys exhausted', `Service name: ${serviceName}`)
            throw new Error('All API keys have been exhausted, and the request failed.')
        }
    }

    await emailService.sendEmail(email, 'API keys exhausted after retries', `Service name: ${serviceName}`)
    throw new Error('All API keys have been exhausted, and the request failed after maximum retries.')
}

