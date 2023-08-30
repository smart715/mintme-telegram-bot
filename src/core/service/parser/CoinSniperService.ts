import { singleton } from 'tsyringe'
import { Blockchain } from '../../../utils'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class CoinSniperService extends AbstractTokenFetcherService {
    public getBlockchainFilterPageUrl(blockchain: Blockchain): string {
        return `https://coinsniper.net/set-filters?network=${blockchain}#all-coins`
    }

    public getNewTokensPageUrl(page: number): string {
        return `https://coinsniper.net/new?page=${page}`
    }

    public async loadToken(tokenId: string): Promise<string> {
        return this.loadPageContent(`https://coinsniper.net/coin/${tokenId}`)
    }
}
