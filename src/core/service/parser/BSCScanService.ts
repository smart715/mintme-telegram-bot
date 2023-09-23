import { singleton } from 'tsyringe'
import { AbstractTokenFetcherService } from './AbstractTokenFetcherService'

@singleton()
export class BSCScanService extends AbstractTokenFetcherService {
    public getAccountsPageUrl(explorerDomain: string, page: number): string {
        return `https://${explorerDomain}/accounts/${page}?ps=100`
    }

    public getTokensPageUrl(explorerDomain: string, page: number): string {
        return `https://${explorerDomain}/tokens?ps=100&p=${page}`
    }

    public getTokenTxnsPageUrl(explorerDomain: string, page: number): string {
        return `https://${explorerDomain}/tokentxns?ps=100&p=${page}`
    }
}
