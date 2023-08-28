import axios from 'axios'
import { singleton } from 'tsyringe'
import { Coin360Token } from '../../../types'

@singleton()
export class Coins360Service {
    public async loadTokens(): Promise<Coin360Token[]> {
        const response = await axios.get(`https://coin360.com/site-api/coins`)

        return response.data.data
    }

    public async loadToken(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coin360.com/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
