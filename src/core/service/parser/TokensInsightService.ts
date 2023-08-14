import axios from "axios";
import config from "config";
import { singleton } from 'tsyringe'

@singleton()
export class TokensInsightService {
    private readonly apiKey = config.get('tokensinsight_api_key') as string

    public async getAllCoins(): Promise<object> {
        const headers = {
            'Content-Type': 'application/json',
            'TI_API_KEY': this.apiKey,
        }

        const response = await axios.get(
            'https://api.tokeninsight.com/api/v1/coins/list',
            {
                headers: headers,
                params: {
                    limit: 1500,
                },
            },
        )

        return response.data
    }
}
