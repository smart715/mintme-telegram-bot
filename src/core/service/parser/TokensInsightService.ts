import axios from 'axios'
import config from 'config'
import { singleton } from 'tsyringe'
import { TokensInsightAllCoinsResponse } from '../../../types/TokensInsight'

@singleton()
export class TokensInsightService {
    private readonly apiKey = config.get('tokensinsight_api_key') as string

    public async getAllCoins(offset: number, limit: number): Promise<TokensInsightAllCoinsResponse> {
        const headers = {
            'Content-Type': 'application/json',
            'TI_API_KEY': this.apiKey,
        }

        const response = await axios.get(
            'https://api.tokeninsight.com/api/v1/coins/list',
            {
                headers: headers,
                params: {
                    offset,
                    limit,
                },
            },
        )

        return response.data
    }
}
