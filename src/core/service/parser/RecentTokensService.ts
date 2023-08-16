import { singleton } from 'tsyringe'
import axios from "axios";

@singleton()
export class RecentTokensService {
    public async getAllTokensPage(blockchain: string, page: number): Promise<string> {
        const apiUrl = `https://recentcoin.com/${blockchain}/page-${page}`

        const response = await axios.get(apiUrl)

        return response.data
    }
}
