import axios from 'axios'
import { singleton } from 'tsyringe'
import { RugFreeCoinsAllCoins } from '../../../types'

@singleton()
export class RugFreeCoinsService {
    public async getAllCoins(page: number): Promise<RugFreeCoinsAllCoins> {
        const response = await axios.get(
            'https://backend.rugfreecoins.com/api/v1/coins',
            {
                params: {
                    per_page: 999,
                    direction: 'DESC',
                    sort_key: 'vote_count',
                    page,
                },
            }
        )

        return response.data
    }
}
