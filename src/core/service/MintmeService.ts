import axios from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class MintmeService {
    private listedTokensAdresses: string[]

    public async getCachedListedTokensAdresses(): Promise<string[]> {
        if (this.listedTokensAdresses) {
            return this.listedTokensAdresses
        }

        const tokens = await this.getListedTokens()

        this.listedTokensAdresses = Object.values(tokens).map((token: any) => token.token_address)

        return this.listedTokensAdresses
    }

    private async getListedTokens(): Promise<any> {
        const response = await axios.get('https://www.mintme.com/dev/api/v2/open/assets/')

        return response.data
    }
}
