import axios from 'axios'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../utils'
import { CMCApiGeneralResponse, CMCCryptocurrency, CMCTokenInfoResponse, Coin360Token, CoinsHunterToken } from '../../types'
import config from 'config'
import { CMCWorkerConfig } from '../types'

@singleton()
export class ParserWorkersService {
    private cmcApiKey: string = config.get<CMCWorkerConfig>('cmcWorker')['apiKey']

    public async loadCoinHunterCoins(blockchain: Blockchain, page: number): Promise<CoinsHunterToken[]> {
        const response = await axios.get(`https://coinhunt.cc/api/v2/coins?query=new&chain=${blockchain.toLowerCase()}&type=all&category=all&sortBy=launch_date:desc&time=all-time&limit=1500&page=${page}`)

        return response.data?.data?.coins
    }

    public async loadCoinVoteListPage(blockchain: Blockchain, page: number): Promise<string> {
        const response = await axios.get(`https://coinvote.cc/new&page=${page}&chain=${blockchain.toLowerCase()}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinVoteTokenPage(coinId: string): Promise<string> {
        const response = await axios.get(`https://coinvote.cc/coin/${coinId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinsGodsTokens(): Promise<string> {
        const response = await axios.get(`https://coinsgods.com/all-time-best`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinsGodsTokenPage(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coinsgods.com/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoin360Tokens(): Promise<Coin360Token[]> {
        const response = await axios.get(`https://coin360.com/site-api/coins`)

        return response.data.data
    }

    public async loadCoin360Token(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coin360.com/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinSniperTokens(blockchain: Blockchain, page: number): Promise<any> {
        const response = await axios.get(`https://coinsniper.net/set-filters?network=${blockchain.toLowerCase()}&page=${page}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async loadCoinSniperToken(tokenId: string): Promise<string> {
        const response = await axios.get(`https://coinsniper.net/coin/${tokenId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async getCmcLastTokens(start: number, limit: number): Promise<CMCApiGeneralResponse<CMCCryptocurrency[]>> {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
            params: {
                CMC_PRO_API_KEY: this.cmcApiKey,
                start,
                limit,
                sort: 'id',
            },
        })

        return response.data
    }

    public async getCmcTokenInfo(slug: string): Promise<CMCApiGeneralResponse<CMCTokenInfoResponse>> {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/info', {
            params: {
                CMC_PRO_API_KEY: this.cmcApiKey,
                slug,
                aux: 'urls,platform',
            },
        })

        return response.data
    }

    public async getCoinLoreCoinsCount(): Promise<number> {
        const response = await axios.get('https://api.coinlore.net/api/global/')

        return response.data? response.data[0].coins_count : 0
    }

    public async loadCoinLoreTokensList(start: number, limit: number): Promise<any[]> {
        const response = await axios.get('https://api.coinlore.net/api/tickers/', {
            params: {
                start,
                limit,
            },
        })

        return response.data?.data
    }

    public async getCoinLoreTokenPage(nameId: string): Promise<string> {
        const response = await axios.get(`https://www.coinlore.com/coin/${nameId}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async getCoinScopeMainPage(): Promise<string> {
        const response = await axios.get(`https://www.coinscope.co/`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }

    public async getCoinScopeTokensData(buildFolder: string, page: number, blockchain: Blockchain): Promise<any> {
        const response = await axios.get(`https://www.coinscope.co/_next/data/${buildFolder}/alltime.json`, {
            params: {
                network: blockchain.toString(),
                page,
            },
        })

        return response.data
    }

    public async loadCoinScopeTokenPage(tokenId: string): Promise<string> {
        const response = await axios.get(`https://www.coinscope.co/coin/${tokenId.toLowerCase()}`)

        return response.data.replace(/(\r\n|\n|\r)/gm, '')
    }
}
