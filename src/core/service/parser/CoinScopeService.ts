import axios from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'
import { CoinScopeApiResponse } from '../../types'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class CoinScopeService extends AbstractTokenFetcherService {
    public async getMainPage(): Promise<string> {
        return this.loadPageContent(`https://www.coinscope.co/`)
    }

    public async getTokensData(
        buildFolder: string,
        page: number,
        blockchain: Blockchain,
    ): Promise<CoinScopeApiResponse> {
        const response = await axios.get(`https://www.coinscope.co/_next/data/${buildFolder}/alltime.json`, {
            params: {
                network: blockchain.toString(),
                page,
            },
        })

        return response.data
    }
}
