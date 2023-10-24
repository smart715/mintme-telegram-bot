import axios, { AxiosInstance } from 'axios'
import { singleton } from 'tsyringe'
import { CoinCodexCoinResponse, CoinInfoResponse } from '../../types'

@singleton()
export class CoinCodexService {
    private axiosStrict: AxiosInstance = axios.create({
        transitional: {
            silentJSONParsing: false,
        },
        responseType: 'json',
    })

    public async getAllCoins(retries: number = 0): Promise<CoinCodexCoinResponse[]> {
        try {
            const response = await this.axiosStrict.get(
                'https://coincodex.com/apps/coincodex/cache/all_coins.json'
            )
            return response.data
        } catch (error) {
            if (retries >= 5) {
                throw error
            }

            return this.getAllCoins(++retries)
        }
    }

    public async getCoinInfo(tokenId: string): Promise<CoinInfoResponse> {
        const response = await this.axiosStrict.get(
            'https://coincodex.com/api/coincodex/get_coin/' + tokenId
        )

        return response.data
    }
}
