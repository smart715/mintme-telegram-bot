import axios from 'axios'
import { singleton } from 'tsyringe'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class CoinLoreService extends AbstractTokenFetcherService {
    public async getCoinsCount(): Promise<number> {
        const response = await axios.get('https://api.coinlore.net/api/global/')

        return response.data? response.data[0].coins_count : 0
    }

    public async loadTokensList(start: number, limit: number): Promise<any[]> {
        const response = await axios.get('https://api.coinlore.net/api/tickers/', {
            params: {
                start,
                limit,
            },
        })

        return response.data?.data
    }

    public async getTokenPage(nameId: string): Promise<string> {
        return this.loadPageContent(`https://www.coinlore.com/coin/${nameId}`)
    }
}
