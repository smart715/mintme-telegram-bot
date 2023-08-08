/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios'
import config from 'config'
import { singleton } from 'tsyringe'
import { BitQueryTransfersResponse } from '../../../types'

@singleton()
export class BitQueryService {
    private readonly apiKey = config.get('bitquery_api_key') as string

    public async getAddresses(offset: number, limit: number, blockchain: string): Promise<BitQueryTransfersResponse> {
        const data = {
            query: `query ($network: EthereumNetwork!, $limit: Int!, $offset: Int!) {
                ethereum(network: $network) {
                  transfers(
                    options: {desc: "count", limit: $limit, offset: $offset}
                    amount: {gt: 0}
                  ) {
                    currency {
                      address
                    }
                    count
                  }
                }
              }`,
            variables: {
                limit: limit,
                offset: offset,
                network: blockchain,
                dateFormat: '%Y-%m-%d',
            },
        }

        const headers = {
            'Content-Type': 'application/json',
            'X-API-KEY': this.apiKey,
        }

        const response = await axios.post(
            'https://graphql.bitquery.io',
            data,
            { headers }
        )

        return response.data
    }
}
