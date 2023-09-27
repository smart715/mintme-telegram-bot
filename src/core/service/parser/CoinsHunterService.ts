import axios from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'
import { CoinsHunterToken } from '../../types'

@singleton()
export class CoinsHunterService {
    public async loadCoins(blockchain: Blockchain, page: number): Promise<CoinsHunterToken[]> {
        const response = await axios.get(`https://coinhunt.cc/api/v2/coins?query=new&chain=${blockchain.toLowerCase()}&type=all&category=all&sortBy=launch_date:desc&time=all-time&limit=1500&page=${page}`)

        return response.data?.data?.coins
    }
}
