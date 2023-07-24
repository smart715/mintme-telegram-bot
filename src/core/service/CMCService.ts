import axios from 'axios'
import config from 'config'
import { singleton } from 'tsyringe'
import { CMCApiGeneralResponse, CMCCryptocurrency, CMCTokenInfoResponse } from '../../types'

@singleton()
export class CMCService {
    private apiKey: string = config.get('coinmarketcap_api_key')

    public async getLastTokens(start: number, limit: number): Promise<CMCApiGeneralResponse<CMCCryptocurrency[]>> {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
            params: {
                CMC_PRO_API_KEY: this.apiKey,
                start,
                limit,
                sort: 'id',
            },
        })

        return response.data
    }

    public async getTokenInfo(slug: string): Promise<CMCApiGeneralResponse<CMCTokenInfoResponse>> {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/info', {
            params: {
                CMC_PRO_API_KEY: this.apiKey,
                slug,
            },
        })

        return response.data
    }
}
