import { singleton } from 'tsyringe'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class BSCScanService extends AbstractTokenFetcherService {
    public getAccountsPageUrl(explorerDomain: string, page: number): string {
        return `https://${explorerDomain}/accounts/${page}?ps=100`
    }
}
