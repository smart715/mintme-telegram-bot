import axios, { AxiosInstance } from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'
import { CoinsHunterToken } from '../../types'

@singleton()
export class CoinsHunterService {
    private axiosStrict: AxiosInstance = axios.create({
        transitional: {
            silentJSONParsing: false,
        },
        responseType: 'json',
    })

    public async loadCoins(blockchain: Blockchain, page: number): Promise<CoinsHunterToken[]> {
        const chainSlug = this.getBlockchainParam(blockchain)

        const response = await this.axiosStrict.get(`https://coinhunt.cc/api/v2/coins?query=new&chain=${chainSlug}&type=all&category=all&sortBy=launch_date:desc&time=all-time&limit=1500&page=${page}`)

        return response.data?.data?.coins
    }

    private getBlockchainParam(blockchain: Blockchain): string {
        switch (blockchain) {
            case Blockchain.BASE:
                return 'Base'
            case Blockchain.ARB:
                return 'Arbitrum'
            default:
                return blockchain.toLowerCase()
        }
    }
}
