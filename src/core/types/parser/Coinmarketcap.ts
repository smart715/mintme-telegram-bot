/* eslint-disable @typescript-eslint/naming-convention */
export interface CMCApiGeneralResponse<T> {
    data: T,
}

export interface CMCTokenInfoResponse {
    [id: string]: {
        urls: {
            [type: string]: string[],
        },
    },
}

export interface CMCCryptocurrency {
    id: number,
    rank: number,
    name: string,
    symbol: string,
    slug: string,
    is_active: boolean,
    platform: {
        id: number,
        name: string,
        symbol: string,
        slug: string,
        token_address: string,
    }
}

export interface CmcCategoryResponse {
    status: Status
    data: CmcCategoryData
  }

export interface Status {
    timestamp: string
    error_code: number
    error_message: any
    elapsed: number
    credit_count: number
    notice: any
  }

export interface CmcCategoryData {
    id: string
    name: string
    title: string
    description: string
    num_tokens: number
    last_updated: string
    avg_price_change: number
    market_cap: number
    market_cap_change: number
    volume: number
    volume_change: number
    coins: CategoryCoin[]
  }

export interface CategoryCoin {
    id: number
    name: string
    symbol: string
    slug: string
    num_market_pairs: number
    date_added: string
    tags: string[]
    max_supply?: number
    circulating_supply: number
    total_supply: number
    is_active: number
    infinite_supply: boolean
    platform?: Platform
    cmc_rank?: number
    is_fiat: number
    self_reported_circulating_supply?: number
    self_reported_market_cap?: number
    tvl_ratio: any
    last_updated: string
    quote: Quote
  }

export interface Platform {
    id: number
    name: string
    symbol: string
    slug: string
    token_address: string
  }

export interface Quote {
    USD: Usd
  }

export interface Usd {
    price?: number
    volume_24h: number
    volume_change_24h: number
    percent_change_1h: number
    percent_change_24h: number
    percent_change_7d: number
    percent_change_30d: number
    percent_change_60d: number
    percent_change_90d: number
    market_cap?: number
    market_cap_dominance: number
    fully_diluted_market_cap: number
    tvl: any
    last_updated: string
  }
