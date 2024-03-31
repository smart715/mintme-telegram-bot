/* eslint-disable @typescript-eslint/naming-convention */
import axios, { AxiosInstance } from 'axios'
import { singleton } from 'tsyringe'
import { BitQueryTransfersResponse } from '../../types'
import { ApiService, RequestOptions } from '../ApiService'

/**
 * @deprecated Not any more needed.
 */
@singleton()
export class BitQueryService {
    private readonly serviceName: string = 'bitquery'
    private readonly axiosInstance: AxiosInstance

    public constructor(
        private readonly apiService: ApiService
    ) {
        this.axiosInstance = axios.create({
            baseURL: 'https://graphql.bitquery.io',
            timeout: 5000,
        })
    }

    public async getAddresses(offset: number, limit: number, blockchain: string): Promise<BitQueryTransfersResponse> {
        const apiParameter = ''
        const requestOptions: RequestOptions = {
            serviceName: this.serviceName,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            params: {
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
            } as Record<string, any>,
        }

        return this.apiService.makeServiceRequests(this.axiosInstance, apiParameter, requestOptions)
    }
}
