import axios from 'axios'
import { singleton } from 'tsyringe'
import { Coin360Token } from '../../types'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class Coins360Service extends AbstractTokenFetcherService {
    public async loadTokens(): Promise<Coin360Token[]> {
        const response = await axios.get(`https://coin360.com/site-api/coins`)

        return response.data.data
    }

    public async loadToken(tokenId: string): Promise<string> {
        return this.loadPageContent(`https://coin360.com/coin/${tokenId}`)
    }
}
