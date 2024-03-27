import { singleton } from 'tsyringe'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

/**
 * @deprecated Not any more needed.
 */
@singleton()
export class RecentTokensService extends AbstractTokenFetcherService {
    public async getAllTokensPage(blockchain: string, page: number): Promise<string> {
        const apiUrl = `https://recentcoin.com/${blockchain}/page-${page}`

        return this.loadPageContent(apiUrl)
    }

    public async getTokenInfoPage(tokenLink: string): Promise<string> {
        const apiUrl = `https://recentcoin.com${tokenLink}` // tokenlink ex.: /token/popo-popo-0xcaf76a5b

        return this.loadPageContent(apiUrl)
    }
}
