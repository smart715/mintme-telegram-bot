import axios from 'axios'
import { singleton } from 'tsyringe'

@singleton()
export class CoinBuddyService {
    public async getAllCoins(tag: string, page: number): Promise<string> {
        const response = await axios.get(
            `https://coinbuddy.co/tags/${tag}?page=${page}`
        )

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
