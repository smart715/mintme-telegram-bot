import axios from 'axios'
import { singleton } from 'tsyringe'
import { CoinCatapultAllCoinsResponse, CoinCatapultTokenInfoGeneralResponse } from '../../types'

@singleton()
export class CoinCatapultService {
    public async getAllCoins(): Promise<CoinCatapultAllCoinsResponse> {
        const response = await axios.get(
            'https://coincatapult.com/api/coins/getObjects'
        )

        return response.data
    }

    public async getTokenInfo(slug: string): Promise<CoinCatapultTokenInfoGeneralResponse> {
        const response = await axios.get(
            'https://coincatapult.com/api/coins/getObject',
            {
                params: {
                    slug,
                },
            }
        )

        return response.data
    }
}
