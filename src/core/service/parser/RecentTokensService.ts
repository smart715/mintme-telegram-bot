import axios from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class RecentTokensService {
    public async getAllTokensPage(blockchain: string, page: number): Promise<string> {
        const apiUrl = `https://recentcoin.com/${blockchain}/page-${page}`
console.log(apiUrl)
        const response = await axios.get(apiUrl)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async getTokenInfoPage(tokenLink: string): Promise<string> {
        const apiUrl = `https://recentcoin.com${tokenLink}` // tokenlink ex.: /token/popo-popo-0xcaf76a5b

        const response = await axios.get(apiUrl)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
