import axios, { AxiosInstance } from 'axios'
import { singleton } from 'tsyringe'
import config from 'config'
import { AccountType, CMCApiGeneralResponse, CMCCryptocurrency, CMCTokenInfoResponse, CMCWorkerConfig } from '../../types'
import { makeRequest, RequestOptions } from '../ApiService'
import { CoinMarketCapAccount, CoinMarketCapComment, CoinMarketCapCommentHistory, ProxyServer } from '../../entity'
import { CoinMarketCapAccountRepository, CoinMarketCapCommentHistoryRepository, CoinMarketCapCommentRepository } from '../../repository'
import { ProxyService } from '../ProxyServerService'

@singleton()
export class CMCService {
    private readonly apiKeys: string[] = config.get<CMCWorkerConfig>('cmcWorker')['apiKeys']
    private readonly axiosInstance: AxiosInstance

    public constructor(
        private readonly cmcAccountsRepository: CoinMarketCapAccountRepository,
        private readonly cmcCommentRepository: CoinMarketCapCommentRepository,
        private readonly cmcCommentHistoryRepository: CoinMarketCapCommentHistoryRepository,
        private readonly proxyService: ProxyService,
    ) {
        this.axiosInstance = axios.create({
            baseURL: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency',
            timeout: 5000,
        })
    }

    public async getLastTokens(start: number, limit: number): Promise<CMCApiGeneralResponse<CMCCryptocurrency[]>> {
        const requestOptions: RequestOptions = {
            apiKeys: this.apiKeys,
            method: 'GET',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            params: {
                start: start,
                limit: limit,
                sort: 'id',
            },
            apiKeyLocation: 'params',
            apiKeyName: 'CMC_PRO_API_KEY',
        }

        return makeRequest<CMCApiGeneralResponse<CMCCryptocurrency[]>>(this.axiosInstance, 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', requestOptions)
    }

    public async getTokenInfo(slug: string): Promise<CMCApiGeneralResponse<CMCTokenInfoResponse>> {
        const requestOptions: RequestOptions = {
            apiKeys: this.apiKeys,
            method: 'GET',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            params: {
                slug,
                aux: 'urls,platform',
            },
            apiKeyLocation: 'params',
            apiKeyName: 'CMC_PRO_API_KEY',
        }

        return makeRequest<CMCApiGeneralResponse<CMCTokenInfoResponse>>(this.axiosInstance, 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info', requestOptions)
    }

    public async findAllEnabledAccounts(): Promise<CoinMarketCapAccount[]> {
        return this.cmcAccountsRepository.findAllEnabledAccounts()
    }

    public async getRandomComment(excludedIds: number[]): Promise<CoinMarketCapComment | undefined> {
        return this.cmcCommentRepository.getRandomComment(excludedIds)
    }

    public async getAccountCommentsCountPerDay(cmcAccount: CoinMarketCapAccount): Promise<number> {
        return this.cmcCommentHistoryRepository.getAccountCommentsCountPerDay(cmcAccount)
    }

    public async getCoinSubmittedComments(coinId: string): Promise<CoinMarketCapCommentHistory[]> {
        return this.cmcCommentHistoryRepository.getCoinSubmittedComments(coinId)
    }

    public async addNewHistoryAction(
        accountId: number,
        coinId: string,
        commentId: number
    ): Promise<void> {
        return this.cmcCommentHistoryRepository.newHistory(accountId, coinId, commentId)
    }

    public async setAccountAsDisabled(cmcAccount: CoinMarketCapAccount): Promise<CoinMarketCapAccount> {
        cmcAccount.isDisabled = true
        return this.cmcAccountsRepository.save(cmcAccount)
    }

    public async updateAccountLastLogin(cmcAccount: CoinMarketCapAccount, date: Date): Promise<CoinMarketCapAccount> {
        cmcAccount.lastLogin = date

        return this.cmcAccountsRepository.save(cmcAccount)
    }

    public async assignNewProxyForAccount(cmcAccount: CoinMarketCapAccount): Promise<ProxyServer|undefined> {
        const proxy = await this.proxyService.getRandomProxy(AccountType.CMC)

        if (proxy) {
            cmcAccount.proxy = proxy
            await this.cmcAccountsRepository.save(cmcAccount)
        }

        return proxy
    }

    public async updateContinousFailedSubmits(
        cmcAccount: CoinMarketCapAccount,
        contiousFails: number
    ): Promise<CoinMarketCapAccount> {
        cmcAccount.continousFailed = contiousFails

        return this.cmcAccountsRepository.save(cmcAccount)
    }
}
