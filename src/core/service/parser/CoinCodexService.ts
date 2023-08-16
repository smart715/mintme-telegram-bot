import axios from 'axios'
import { singleton } from 'tsyringe'
import { CoinCodexCoinResponse, CoinInfoResponse } from '../../../types'

@singleton()
export class CoinCodexService {
    public async getAllCoins(): Promise<CoinCodexCoinResponse[]> {
        const response = await axios.get(
            'https://coincodex.com/apps/coincodex/cache/all_coins.json'
        )

        return response.data
    }

    public async getCoinInfo(tokenId: string): Promise<CoinInfoResponse> {
        const response = await axios.get(
            'https://coincodex.com/api/coincodex/get_coin/' + tokenId
        )

        return response.data
    }
}
