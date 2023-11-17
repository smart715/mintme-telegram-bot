import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

interface RequestOptions {
    apiKeys?: string[];
    headers?: Record<string, string>;
    params?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    apiKeyLocation?: 'headers' | 'params';
    apiKeyName?: string;
}

export async function makeRequest<T>(
    axiosInstance: AxiosInstance,
    url: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        apiKeys = [],
        headers = {},
        params = {},
        method = 'GET',
        apiKeyLocation = 'headers',
        apiKeyName = 'X-API-KEY',
    } = options

    let retries = apiKeys.length

    while (retries > 0) {
        const apiKey = apiKeys[apiKeys.length - retries]
        const config: AxiosRequestConfig = {
            url,
            method,
            headers: {
                ...headers,
                ['headers' === apiKeyLocation ? apiKeyName : '']: apiKey,
            },
            params: 'params' === apiKeyLocation ? { ...params, [apiKeyName]: apiKey } : params,
        }

        try {
            const response: AxiosResponse<T> = await axiosInstance(config)
            return response.data
        } catch (error) {
            // If request fails with the current key, try the next one
            retries--
        }
    }

    // If all API keys fail, you can handle the error or throw it
    throw new Error('All API keys have been exhausted, and the request failed.')
}
