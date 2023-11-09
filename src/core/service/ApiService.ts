import axios, { AxiosRequestConfig } from 'axios'

export class ApiService {
    private readonly apiKeys: string[]
    private currentApiKeyIndex: number = 0

    public constructor(apiKeys: string[]) {
        this.apiKeys = apiKeys
    }


    private async makeRequest(url: string, apiKey: string, config?: AxiosRequestConfig): Promise<any> {
        const headers = {
            CONTENT_TYPE: 'application/json',
            X_API_KEY: apiKey,
        }

        try {
            const response = await axios.post(url, config, { headers })
            return response.data
        } catch (error:any) {
            throw new Error(`Request failed with error: ${error.message}`)
        }
    }

    public async makeRequestWithRetry(url: string, config?: AxiosRequestConfig): Promise<any> {
        let retries = this.apiKeys.length

        while (retries > 0) {
            const apiKey = this.apiKeys[this.currentApiKeyIndex]

            try {
                return await this.makeRequest(url, apiKey, config)
            } catch (error) {
                // If this key fails, move to the next key and retry
                this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length
                retries--
            }
        }

        throw new Error('All API keys have been exhausted, and the request failed.')
    }
}
