import axios from 'axios'
import { singleton } from 'tsyringe'
import { AllCoinsTokenResponse, CoinInfo } from '../../types'

@singleton()
export class CoinGeckoService {
    public async getAll(link: string): Promise<AllCoinsTokenResponse[]> {
        const response = await axios.get(link)

        return response.data
    }

    public async getCoinInfo(tokenId: string): Promise<CoinInfo> {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/' + tokenId)

        return response.data
    }
}
