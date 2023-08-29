import axios from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'

@singleton()
export class CoinSniperService {
    public getBlockchainFilterPageUrl(blockchain: Blockchain): string {
        return `https://coinsniper.net/set-filters?network=${blockchain}#all-coins`
    }

    public getNewTokensPageUrl(page: number): string {
        return `https://coinsniper.net/new?page=${page}`
    }

    public async loadToken(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coinsniper.net/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
