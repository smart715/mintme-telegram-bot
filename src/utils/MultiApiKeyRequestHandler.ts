import axios, { AxiosRequestConfig } from 'axios'

export class MultiApiKeyRequestHandler {
    private apiKeys: string[]
    private currentApiKeyIndex: number

    public constructor(apiKeys: string[]) {
        this.apiKeys = apiKeys
        this.currentApiKeyIndex = 0
    }

    public async makeRequest(
        url: string,
        config?: AxiosRequestConfig,
        method: string = 'get',
        headerKey: string = 'X-API-KEY' 

    ): Promise<any> {
        let retries = this.apiKeys.length

        while (retries > 0) {
            const headers = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
                [headerKey]: this.apiKeys[this.currentApiKeyIndex],
            }

            try {
                const response = await axios({
                    method: method,
                    url: url,
                    data: 'post' === method ? config?.data : undefined,
                    params: 'get' === method ? config?.params : undefined,
                    headers: headers,
                } as AxiosRequestConfig)

                return response.data
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
