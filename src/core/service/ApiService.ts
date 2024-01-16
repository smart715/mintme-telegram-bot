import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ServiceRepository, ApiKeyRepository } from '../repository'

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
    serviceRepository: ServiceRepository,
    apiKeyRepository: ApiKeyRepository
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

    while (retries <= maxRetries) {
        const service = await serviceRepository.findByName(serviceName)

        if (service) {
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
                throw new Error('All API keys have been exhausted, and the request failed.')
            }
        } else {
            throw new Error('Service not found.')
        }
    }

    throw new Error('All API keys have been exhausted, and the request failed after maximum retries.')
}
