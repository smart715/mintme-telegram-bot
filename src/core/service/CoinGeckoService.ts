import { singleton } from "tsyringe";
import axios from "axios";

@singleton()
export class CoinGeckoService {
    public async getAll(link: string): Promise<object> {
        try {
            const response = await axios.get(link);

            return response.data;
        } catch (error: any) {
            console.log("[CoinGecko] Failed to fetch all tokens. Reason: " + error.message)
        }
    }

    public async getCoinInfo(tokenId: string): Promise<object> {
        try {
            const response = await axios.get("https://api.coingecko.com/api/v3/coins/" + tokenId)

            return response.data
        } catch (error: any) {
            console.log("[CoinGecko] Failed to fetch coin info. Reason: " + error.message)
        }
    }
}
