import axios from "axios"
import config from "config"
import { singleton } from "tsyringe"
import { CMCApiGeneralResponse, CMCCryptocurrency, CMCTokenInfoResponse } from "../../types/Coinmarketcap"

@singleton()
export class CMCService {
    API_KEY: string = config.get('coinmarketcap_api_key');

    public async getLastTokens(start: number, limit: number): Promise<CMCApiGeneralResponse<CMCCryptocurrency[]>> {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
            params: {
                CMC_PRO_API_KEY: this.API_KEY,
                start,
                limit,
                sort: "id",
            },
        });

        return response.data;
    }

    public async getTokenInfo(slug: string): Promise<CMCApiGeneralResponse<CMCTokenInfoResponse>> {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/info', {
            params: {
                CMC_PRO_API_KEY: this.API_KEY,
                slug,
            },
        });

        return response.data;
    }
}