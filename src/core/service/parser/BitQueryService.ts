/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios'
import config from 'config'
import { singleton } from 'tsyringe'
import { BitQueryTransfersResponse } from '../../types'

@singleton()
export class BitQueryService {
  private readonly apiKeys: string[] = config.get('bitquery_api_keys') as string[]
  private currentApiKeyIndex: number = 0

  public async getAddresses(offset: number, limit: number, blockchain: string): Promise<BitQueryTransfersResponse> {
    let retries = this.apiKeys.length

    while (retries > 0) {
      const apiKey = this.apiKeys[this.currentApiKeyIndex]
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
          dateFormat: '%Y-%m-d',
        },
      }
      const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      }

      try {
        const response = await axios.post(
          'https://graphql.bitquery.io',
          data,
          { headers }
        )

        return response.data
      } catch (error) {
        // If this key fails, move to the next key and retry
        this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length
      }

      retries--
    }

    // Handle the case where all keys are exhausted or other errors occur
    throw new Error('All API keys have been exhausted, and the request failed.')
  }
}
