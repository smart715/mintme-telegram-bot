import axios from 'axios'
import { singleton } from 'tsyringe'
import config from 'config'
import { Logger } from 'winston'

@singleton()
export class FirewallService {
    private flaresolverrServerUrl: string = config.get<string>('flaresolverr_server_url')
    private maxRetryAttempts: number = 5

    public async getCloudflareCookies(
        url: string,
        logger: Logger,
    ): Promise<{cookies: {name: string, value: string}[], userAgent: string}> {
        let retryNumber = 1

        while (retryNumber <= this.maxRetryAttempts) {
            logger.info(`Solving chalenge on ${url} | Attempt: ${retryNumber}`)

            const response = await axios.post(this.flaresolverrServerUrl, {
                cmd: 'request.get',
                maxTimeout: 120000,
                url,
            })

            if ('ok' === response.data?.status && response.data?.solution?.cookies) {
                return { cookies: response.data.solution.cookies, userAgent: response.data.solution.userAgent }
            }

            retryNumber++
        }

        throw new Error('Could not get cookies from flaresolverr response')
    }
}
