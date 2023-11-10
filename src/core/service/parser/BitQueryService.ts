import { singleton } from 'tsyringe'
import config from 'config'
// eslint-disable-next-line import/no-internal-modules
import { MultiApiKeyRequestHandler } from '../../../utils/MultiApiKeyRequestHandler'
import { BitQueryTransfersResponse } from '../../types'

@singleton()
export class BitQueryService {
    private readonly apiKeys: string[]
    private readonly requestHandler: MultiApiKeyRequestHandler

    public constructor() {
        this.apiKeys = config.get('bitquery_api_keys') as string[]
        this.requestHandler = new MultiApiKeyRequestHandler(this.apiKeys)
    }

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
                dateFormat: '%Y-%m-d',
            },
        }

        const url = 'https://graphql.bitquery.io'

        // Use MultiApiKeyRequestHandler to make the request
        return this.requestHandler.makeRequest(url, { data }, 'post')
    }
}
