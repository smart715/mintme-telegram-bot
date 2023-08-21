import axios from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../utils'
import { Coin360Token, CoinsHunterToken } from '../../types'

@singleton()
export class ParserWorkersService {
    public async loadCoinHunterCoins(blockchain: Blockchain, page: number): Promise<CoinsHunterToken[]> {
        const response = await axios.get(`https://coinhunt.cc/api/v2/coins?query=new&chain=${blockchain}&type=all&category=all&sortBy=launch_date:desc&time=all-time&limit=1500&page=${page}`)

        return response.data.data.coins
    }

    public async loadCoinVoteListPage(blockchain: Blockchain, page: number): Promise<string> {
        const response = await axios.get(`https://coinvote.cc/new&page=${page}&chain=${blockchain.toLowerCase()}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinVoteTokenPage(coinId: string): Promise<string> {
        const response = await axios.get(`https://coinvote.cc/coin/${coinId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinsGodsTokens(): Promise<string> {
        const response = await axios.get(`https://coinsgods.com/all-time-best`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinsGodsTokenPage(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coinsgods.com/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoin360Tokens(): Promise<Coin360Token[]> {
        const response = await axios.get(`https://coin360.com/site-api/coins`)

        return response.data.data
    }

    public async loadCoin360Token(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coin360.com/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
