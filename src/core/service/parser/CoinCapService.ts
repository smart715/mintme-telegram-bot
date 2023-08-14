import axios from 'axios'
import { singleton } from 'tsyringe'
import { CoinCapCoinInfoResponse } from '../../../types'

@singleton()
export class CoinCapService {
    public async getCoinsInfo(page: number, limit: number): Promise<CoinCapCoinInfoResponse> {
        const offset = (page - 1) * limit

        const response = await axios.get(
            `https://api.coincap.io/v2/assets?limit=${limit}&offset=${offset}`
        )

        return response.data
    }
}
