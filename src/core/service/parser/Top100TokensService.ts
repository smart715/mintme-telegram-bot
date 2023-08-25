import axios from 'axios'
import { singleton } from 'tsyringe'
import { Top100TokensTopListResponse } from '../../../types'

@singleton()
export class Top100TokensService {
    public async getTokens(page: number): Promise<Top100TokensTopListResponse> {
        const response = await axios.get(
            'https://api.top100token.com/search/toplist/trending',
            {
                params: {
                    page,
                },
            }
        )

        return response.data
    }
}
