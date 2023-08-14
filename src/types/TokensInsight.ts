export interface TokensInsightAllCoinsResponse {
    status: {
        code: number,
        message: string,
        timestamp: number
    },
    data: {
        items: AllCoinsItem[],
        page_info: {
            total_results: number,
        }
    }
}

export interface AllCoinsItem {
    price: number,
    name: string,
    symbol: string,
    id: string,
    logo: string,
    spot_volume_24h: number,
    price_change_24h: number,
    url: string,
}

export interface TokensInsightCoinDataResponse {
    status: Status
    data: {
        id: string
        rating: Rating
        name: string
        rank: null | number
        symbol: string
        logo: string
        block_explorers: string[]
        platforms: TokensInsightPlatform[]
        website: string[]
        community: Community
        resource: {
            whitepaper: string[]
            doc: string[]
            audit_reports: string[]
        }
        code: string[]
        investors: any[] // Replace 'any' with appropriate type if available
        localization: Localization[]
        market_data: {
            max_supply: null | number
            circulating_supply: null | number
            circulating_supply_percentage: null | number
            last_updated: number
            price: PriceData[]
        }
        tickers: Ticker[]
    }
}

interface Status {
    code: number
    message: string
    timestamp: number
}

interface Rating {
    rating: null | string
    update_date: null | string
}

export interface TokensInsightPlatform {
    name: string
    address: string
}

interface Community {
    twitter: string
    telegram: string
    discord: string
    facebook: string
    linkedin: string
    instagram: string
    reddit: string
    youtube: string
    medium: string
    mirror: string
    others: { name: string, link: string }[]
}

interface Localization {
    lang: string
    description: string
    description_short: string
    tags: string[]
}

interface PriceData {
    currency: string
    price_latest: number
    market_cap: null | number
    fully_diluted_valuation: null | number
    price_change_24h: null | number
    price_change_percentage_24h: null | number
    price_change_percentage_1h: null | number
    price_change_percentage_7d: null | number
    price_change_percentage_30d: null | number
    price_change_percentage_90d: null | number
    price_change_percentage_180d: null | number
    high_24h: null | number
    low_24h: null | number
    high_7d: null | number
    low_7d: null | number
    ath: number
    ath_date: number
    atl: number
    atl_date: number
    vol_spot_24h: number
    vol_spot_change_24h: null | number
    vol_spot_change_percentage_24h: null | number
    vol_derivatives_24h: null | number
    vol_derivatives_change_24h: null | number
    vol_derivatives_change_percentage_24h: null | number
    vol_spot_7d: number
    vol_derivatives_7d: null | number
}

interface Ticker {
    base: string
    quote: string
    base_id: string
    pair_type: string
    exchange_name: string
    exid: string
    price_latest: number
    price_change_percentage_24h: number
    vol_24h: number
    vol_change_percentage_24h: number
    last_traded_at: number
    is_outdated: boolean
    is_anomaly: boolean
    is_valid: boolean
}
