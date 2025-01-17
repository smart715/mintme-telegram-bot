import axios from 'axios'
import { singleton } from 'tsyringe'
import { CoinDiscoveryGetTokensResponse } from '../../types'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class CoinDiscoveryService extends AbstractTokenFetcherService {
    public async getTokens(start: number): Promise<CoinDiscoveryGetTokensResponse> {
        const response = await axios.get(`https://coindiscovery.app/tokens/new?columns[0][data]=&columns[0][name]=&columns[0][searchable]=true&columns[0][orderable]=true&columns[0][search][value]=&columns[0][search][regex]=false&columns[1][data]=&columns[1][name]=&columns[1][searchable]=true&columns[1][orderable]=true&columns[1][search][value]=&columns[1][search][regex]=false&columns[2][data]=&columns[2][name]=&columns[2][searchable]=true&columns[2][orderable]=true&columns[2][search][value]=&columns[2][search][regex]=false&columns[3][data]=&columns[3][name]=&columns[3][searchable]=true&columns[3][orderable]=true&columns[3][search][value]=&columns[3][search][regex]=false&columns[4][data]=&columns[4][name]=&columns[4][searchable]=true&columns[4][orderable]=true&columns[4][search][value]=&columns[4][search][regex]=false&columns[5][data]=&columns[5][name]=&columns[5][searchable]=true&columns[5][orderable]=true&columns[5][search][value]=&columns[5][search][regex]=false&columns[6][data]=&columns[6][name]=&columns[6][searchable]=true&columns[6][orderable]=true&columns[6][search][value]=&columns[6][search][regex]=false&columns[7][data]=name&columns[7][name]=&columns[7][searchable]=false&columns[7][orderable]=true&columns[7][search][value]=&columns[7][search][regex]=false&columns[8][data]=upvotes&columns[8][name]=&columns[8][searchable]=false&columns[8][orderable]=true&columns[8][search][value]=&columns[8][search][regex]=false&columns[9][data]=name&columns[9][name]=&columns[9][searchable]=false&columns[9][orderable]=true&columns[9][search][value]=&columns[9][search][regex]=false&start=${start}&length=500&search[value]=&search[regex]=false`)

        return response.data
    }

    public async getInfo(nameSlug: string): Promise<string> {
        return this.loadPageContent(`https://coindiscovery.app/coin/${nameSlug}/overview`)
    }
}
