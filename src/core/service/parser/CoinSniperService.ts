import axios from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'

@singleton()
export class CoinSniperService {
    public async loadTokens(blockchain: Blockchain, page: number): Promise<any> {
        const response = await axios.get(`https://coinsniper.net/set-filters?network=${blockchain.toLowerCase()}&page=${page}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadToken(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coinsniper.net/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
