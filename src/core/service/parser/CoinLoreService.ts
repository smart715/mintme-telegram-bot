import axios from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class CoinLoreService {
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
        const response = await axios.get(`https://www.coinlore.com/coin/${nameId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
