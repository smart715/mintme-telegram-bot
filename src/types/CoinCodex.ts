export interface CoinCodexCoinResponse {
    aliases: string,
    categories: number[],
    ccu_slug: string
    display: string
    display_symbol: string
    growth_all_time: string|null
    ico_end: string|null
    image_id: string
    image_t: number
    include_supply: string
    last_price_usd: number|null
    last_update: string
    market_cap_rank:number|null
    market_cap_usd: number|null
    name: string
    price_change_1D_percent: number|null
    price_change_1H_percent: number|null
    price_change_3Y_percent: number|null
    price_change_5Y_percent: number|null
    price_change_7D_percent: number|null
    price_change_30D_percent: number|null
    price_change_90D_percent: number|null
    price_change_180D_percent: number|null
    price_change_365D_percent: number|null
    price_change_ALL_percent: number|null
    price_change_YTD_percent: number
    shortname: string
    supply: number|null
    symbol: string
    trading_since: string|null
    use_volume: string
    volume_24_usd: number
    volume_rank: number|null
}

export interface CoinInfoResponse {
    platform: string
    website: string,
    socials: ConiCodexSocialObj[]
}

export interface ConiCodexSocialObj {
    id: string,
    name: string,
    coincodex_coin_symbol: string,
    coincodex_socials_id: string,
    value: string,
    label: string,
    order_by: string,
}
