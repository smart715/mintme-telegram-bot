import axios, { AxiosRequestConfig } from 'axios'

export class ApiService {
    private readonly apiKeys: string[]
    private currentApiKeyIndex: number = 0

    public constructor(apiKeys: string[]) {
        this.apiKeys = apiKeys
    }

    private async makeRequest(
        url: string,
        apiKey: string,
        config?: AxiosRequestConfig,
        headers?: Record<string, string>,
        method: string = 'get'
    ): Promise<any> {
        try {
            const response = await axios({
                method: method,
                url: url,
                data: 'post' === method ? config?.data : undefined,
                params: 'get' === method ? config?.params : undefined,
                headers: headers,
            } as AxiosRequestConfig)

            return response.data
        } catch (error: any) {
            throw new Error(`Request failed with error: ${error.message}`)
        }
    }

    public async makePostRequestWithRetry(
        url: string,
        config?: AxiosRequestConfig,
        headers?: Record<string, string>
    ): Promise<any> {
        return this.makeRequestWithRetry(url, 'post', config, headers)
    }

    public async makeGetRequestWithRetry(
        url: string,
        config?: AxiosRequestConfig,
        headers?: Record<string, string>
    ): Promise<any> {
        return this.makeRequestWithRetry(url, 'get', config, headers)
    }

    private async makeRequestWithRetry(
        url: string,
        method: string,
        config?: AxiosRequestConfig,
        headers?: Record<string, string>
    ): Promise<any> {
        let retries = this.apiKeys.length

        while (retries > 0) {
            const apiKey = this.apiKeys[this.currentApiKeyIndex]

            try {
                return await this.makeRequest(url, apiKey, config, headers, method)
            } catch (error) {
                // If this key fails, move to the next key and retry
                this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length
                retries--
            }
        }

        // Handle the case where all keys are exhausted or other errors occur
        throw new Error('All API keys have been exhausted, and the request failed.')
    }
}
