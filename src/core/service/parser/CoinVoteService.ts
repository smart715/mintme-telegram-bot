import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class CoinVoteService extends AbstractTokenFetcherService {
    public async loadListPage(blockchain: Blockchain, page: number): Promise<string> {
        return this.loadPageContent(`https://coinvote.cc/new&page=${page}&chain=${blockchain.toLowerCase()}`)
    }

    public async loadTokenPage(coinId: string): Promise<string> {
        return this.loadPageContent(`https://coinvote.cc/coin/${coinId}`)
    }
}
