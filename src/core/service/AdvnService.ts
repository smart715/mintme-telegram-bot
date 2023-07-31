import { singleton } from "tsyringe";
import axios from "axios";
import {AdvnGeneralResponse} from "../../types/Advn";

@singleton()
export class AdvnService {
    public async getTokens(start: number): Promise<AdvnGeneralResponse|null> {
        try {
            const response = await axios.get(
                `https://uk.advfn.com/common/cryptocurrency/api/getTokens?columns[0][data]=platform&columns[0][name]=&columns[0][searchable]=true&columns[0][orderable]=true&columns[0][search][value]=&columns[0][search][regex]=true&columns[1][data]=logo&columns[1][name]=&columns[1][searchable]=true&columns[1][orderable]=true&columns[1][search][value]=&columns[1][search][regex]=true&columns[2][data]=name_symbol&columns[2][name]=&columns[2][searchable]=true&columns[2][orderable]=true&columns[2][search][value]=&columns[2][search][regex]=true&columns[3][data]=price_numeric&columns[3][name]=&columns[3][searchable]=true&columns[3][orderable]=true&columns[3][search][value]=&columns[3][search][regex]=true&columns[4][data]=change&columns[4][name]=&columns[4][searchable]=true&columns[4][orderable]=true&columns[4][search][value]=&columns[4][search][regex]=true&columns[5][data]=market_cap&columns[5][name]=&columns[5][searchable]=true&columns[5][orderable]=true&columns[5][search][value]=&columns[5][search][regex]=true&columns[6][data]=change_percentage_numeric&columns[6][name]=&columns[6][searchable]=true&columns[6][orderable]=true&columns[6][search][value]=&columns[6][search][regex]=true&columns[7][data]=volume_24h_abbreviated&columns[7][name]=&columns[7][searchable]=true&columns[7][orderable]=true&columns[7][search][value]=&columns[7][search][regex]=true&columns[8][data]=volume_24h&columns[8][name]=&columns[8][searchable]=true&columns[8][orderable]=true&columns[8][search][value]=&columns[8][search][regex]=true&columns[9][data]=volume_trend&columns[9][name]=&columns[9][searchable]=true&columns[9][orderable]=true&columns[9][search][value]=&columns[9][search][regex]=true&columns[10][data]=avg_7_day_volume_trend&columns[10][name]=&columns[10][searchable]=true&columns[10][orderable]=true&columns[10][search][value]=&columns[10][search][regex]=true&columns[11][data]=chart_url&columns[11][name]=&columns[11][searchable]=true&columns[11][orderable]=true&columns[11][search][value]=&columns[11][search][regex]=true&order[0][column]=0&order[0][dir]=asc&start=${start}&length=3000&search[value]=&search[regex]=true`)

            return response.data;
        } catch (error: any) {
            console.log("[ADVN] Failed to fetch tokens. Reason: " + error.message)

            return null
        }
    }

    public async getTokenInfo(id: string): Promise<string|null> {
        try {
            const response = await axios.get(`https://www.advfn.com/crypto/${id}/fundamentals`)

            return response.data.replace(/(\r\n|\n|\r)/gm, "")
        } catch (error: any) {
            console.log("[ADVN] Failed to fetch token info. Reason: " + error.message)

            return null
        }
    }
}
