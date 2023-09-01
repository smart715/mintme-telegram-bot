import axios from 'axios'
import { singleton } from 'tsyringe'
import config from 'config'

@singleton()
export class FirewallService {
    private flaresolverrServerUrl: string = config.get<string>('flaresolverr_server_url')

    public async getCloudflareCookies(
        url: string,
    ): Promise<{cookies: {name: string, value: string}[], userAgent: string}> {
        const response = await axios.post(this.flaresolverrServerUrl, {
            cmd: 'request.get',
            maxTimeout: 60000,
            url,
        })

        if (response.data?.status === 'ok' && response.data?.solution?.cookies) {
            return {cookies: response.data.solution.cookies, userAgent: response.data.solution.userAgent}
        }

        throw new Error('somethin went wrogn')
    }
}
