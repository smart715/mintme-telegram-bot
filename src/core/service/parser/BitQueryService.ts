/* eslint-disable @typescript-eslint/naming-convention */
import axios, { AxiosInstance } from 'axios'
import { singleton, inject } from 'tsyringe'
import { BitQueryTransfersResponse } from '../../types'
import { ApiServiceHandler, RequestOptions } from '../ApiServiceHandler'

@singleton()
export class BitQueryService {
    private readonly serviceName: string = 'bitquery'
    private readonly axiosInstance: AxiosInstance

    public constructor(
        @inject(ApiServiceHandler) private readonly apiServiceHandler: ApiServiceHandler<BitQueryTransfersResponse>
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

        return this.apiServiceHandler.makeServiceRequests(this.axiosInstance, apiParameter, requestOptions)
    }
}
