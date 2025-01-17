import axios, { AxiosInstance } from 'axios'
import { singleton } from 'tsyringe'
import { ApiService, RequestOptions } from '../ApiService'
import { AccountType, CMCApiGeneralResponse, CmcCategoryResponse, CMCCryptocurrency, CMCTokenInfoResponse } from '../../types'
import { CoinMarketCapAccount, CoinMarketCapComment, CoinMarketCapCommentHistory, ProxyServer } from '../../entity'
import { CoinMarketCapAccountRepository, CoinMarketCapCommentHistoryRepository, CoinMarketCapCommentRepository } from '../../repository'
import { ProxyService } from '../ProxyServerService'

@singleton()
export class CMCService {
    private readonly serviceName: string = 'cmcWorker'
    private readonly axiosInstance: AxiosInstance

    public constructor(
        private readonly apiService: ApiService,
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

    public async getLastTokens(
        start: number,
        limit: number
    ): Promise<CMCApiGeneralResponse<CMCCryptocurrency[]>> {
        const requestOptions: RequestOptions = {
            serviceName: this.serviceName,
            method: 'GET',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            params: {
                start,
                limit,
                sort: 'id',
            },
            apiKeyLocation: 'params',
            apiKeyName: 'CMC_PRO_API_KEY',
        }

        return this.apiService.makeServiceRequests(
            this.axiosInstance,
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map',
            requestOptions
        )
    }

    public async getCategoryTokens(
        id: string,
        start: number,
        limit: number
    ): Promise<CmcCategoryResponse> {
        const requestOptions: RequestOptions = {
            serviceName: this.serviceName,
            method: 'GET',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            params: {
                id,
                start,
                limit,
            },
            apiKeyLocation: 'params',
            apiKeyName: 'CMC_PRO_API_KEY',
        }

        return this.apiService.makeServiceRequests(
            this.axiosInstance,
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/category',
            requestOptions
        )
    }

    public async getTokenInfo(
        slug: string
    ): Promise<CMCApiGeneralResponse<CMCTokenInfoResponse>> {
        const requestOptions: RequestOptions = {
            serviceName: this.serviceName,
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

        return this.apiService.makeServiceRequests(
            this.axiosInstance,
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info',
            requestOptions
        )
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
        cmcAccount.proxy = null
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
        isReset: boolean
    ): Promise<CoinMarketCapAccount> {
        if (isReset) {
            cmcAccount.continousFailed = 0
        } else {
            cmcAccount.continousFailed += 1
        }

        return this.cmcAccountsRepository.save(cmcAccount)
    }
}
