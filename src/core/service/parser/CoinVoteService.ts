import axios from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'

@singleton()
export class CoinVoteService {
    public async loadCoinsListPage(blockchain: Blockchain, page: number): Promise<string> {
        const response = await axios.get(`https://coinvote.cc/new&page=${page}&chain=${blockchain.toLowerCase()}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinPage(coinId: string): Promise<string> {
        const response = await axios.get(`https://coinvote.cc/coin/${coinId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
