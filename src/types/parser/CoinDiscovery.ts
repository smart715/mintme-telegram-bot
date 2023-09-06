/* eslint-disable @typescript-eslint/naming-convention */

export interface CoinDiscoveryGetTokensResponse {
    data: CoinData[],
    recordsFiltered: number,
    recordsTotal: number,
}

export interface CoinData {
    chain: string,
    contract: string,
    diluted_market_cap: string,
    fav: number,
    id: string,
    is_presale: string,
    launch_at: string,
    logo: string,
    market_cap: string,
    name: string,
    name_slug: string,
    price: string,
    price_1: string,
    price_6: string,
    symbol: string,
    up: string,
    upvotes: string,
    upvotes_today: string,
}
