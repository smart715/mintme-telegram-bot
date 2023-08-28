import axios from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class CoinsGodsService {
    public async loadTokens(): Promise<string> {
        const response = await axios.get(`https://coinsgods.com/all-time-best`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadTokenPage(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coinsgods.com/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
