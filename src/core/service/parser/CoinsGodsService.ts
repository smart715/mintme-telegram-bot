import { singleton } from 'tsyringe'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class CoinsGodsService extends AbstractTokenFetcherService {
    public async loadTokens(): Promise<string> {
        return this.loadPageContent(`https://coinsgods.com/all-time-best`)
    }

    public async loadTokenPage(tokenId: string): Promise<string> {
        return this.loadPageContent(`https://coinsgods.com/coin/${tokenId}`)
    }
}
