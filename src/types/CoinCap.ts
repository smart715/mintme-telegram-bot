export interface CoinCapCoinInfoResponse {
    data: CoinCapTokenData[],
    timestamp: number
}

export interface CoinCapTokenData {
    changePercent24Hr: string|null,
    explorer: string|null,
    id: string,
    marketCapUsd: string|null,
    maxSupply: string|null,
    name: string,
    priceUsd: string|null,
    rank: string,
    supply: string|null,
    symbol: string,
    volumeUsd24Hr: string|null,
    vwap24Hr: string|null,
}
