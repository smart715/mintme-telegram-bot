import axios from 'axios'
import config from 'config'
import { singleton } from 'tsyringe'
import { BitQueryTransfersResponse } from '../../../types'

@singleton()
export class BitQueryService {
    private readonly apiKey = config.get('bitquery_api_key') as string

    public async getAddresses(offset: number, limit: number, blockchain: string): Promise<BitQueryTransfersResponse> {
        const response = await axios.post(
            'https://graphql.bitquery.io',
            {
                headers: {
                    'X-API-KEY': this.apiKey,
                }
            }
        )

        return response.data
    }
}
