import axios, { AxiosResponse } from 'axios'
import { sleep } from './index'
import { Logger } from 'winston'

export class RetryAxios {
    private readonly maxAttemptsPerRequest = 5
    private readonly sleepTimeBetweenAttempts = 5 * 1000

    public async get(url: string, logger: Logger, attempt: number = 1): Promise<AxiosResponse<any, any>> {
        try {
            return await axios.get(url)
        } catch (error) {
            if (this.maxAttemptsPerRequest < attempt) {
                logger.warn(`[${RetryAxios.name}] Can't load url: ${url}`)

                throw (error)
            }

            await sleep(this.sleepTimeBetweenAttempts)

            return this.get(url, logger, attempt + 1)
        }
    }
}
