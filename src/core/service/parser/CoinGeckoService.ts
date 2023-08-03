import { singleton } from 'tsyringe'
import axios from 'axios'
import { CoinGeckoAllCoinsResponse, CoinInfo } from '../../../types'

@singleton()
export class CoinGeckoService {
    public async getAll(link: string): Promise<CoinGeckoAllCoinsResponse> {
        const response = await axios.get(link)

        return response.data
    }

    public async getCoinInfo(tokenId: string): Promise<CoinInfo> {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/' + tokenId)

        return response.data
    }
}
