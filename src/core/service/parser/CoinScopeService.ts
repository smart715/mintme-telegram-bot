import axios from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'
import { CoinScopeApiResponse } from '../../../types'

@singleton()
export class CoinScopeService {
    public async getMainPage(): Promise<string> {
        const response = await axios.get(`https://www.coinscope.co/`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
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
