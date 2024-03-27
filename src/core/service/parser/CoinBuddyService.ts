import axios from 'axios'
import { singleton } from 'tsyringe'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

/**
 * @deprecated Not any more needed.
 */
@singleton()
export class CoinBuddyService extends AbstractTokenFetcherService {
    public async getAllCoins(tag: string, page: number): Promise<string> {
        const response = await axios.get(
            'https://coinbuddy.co/tags/' + tag,
            {
                params: {
                    page: page,
                },
            }
        )

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async getCoinInfo(path: string): Promise<string> {
        return this.loadPageContent('https://coinbuddy.co' + path)
    }
}
