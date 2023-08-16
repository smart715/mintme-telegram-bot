import axios from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class RecentTokensService {
    public async getAllTokensPage(blockchain: string, page: number): Promise<string> {
        const apiUrl = `https://recentcoin.com/${blockchain}/page-${page}`

        const response = await axios.get(apiUrl)

        return response.data
    }
}
