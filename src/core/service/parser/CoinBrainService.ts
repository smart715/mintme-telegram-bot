import axios from 'axios'
import { singleton } from 'tsyringe'
import { CoinBrainGetTokensGeneralResponse } from '../../types'

@singleton()
export class CoinBrainService {
    public async getTokens(endCursor: string): Promise<CoinBrainGetTokensGeneralResponse> {
        const response = await axios.post(
            `https://api.coinbrain.com/cointoaster/coins?size=100&sort=age:asc&after=${endCursor}`,
        )

        return response.data
    }

    public async getTokenInfo(prefix: string, address: string): Promise<string> {
        const response = await axios.get(
            'https://coinbrain.com/coins/' + prefix + '-' + address
        )

        return response.data
    }
}
