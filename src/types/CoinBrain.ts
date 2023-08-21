export interface CoinBrainGetTokensGeneralResponse {
    endCursor: string,
    hasNextPage: boolean,
    hasPreviousPage: boolean,
    items: CoinBrainItemTokensGeneralResponse[],
    startCursor: string,
}

export interface CoinBrainItemTokensGeneralResponse {
    address: string,
    chainId: number,
    decimals: number,
    favorite: boolean,
    firstTradingDate: string|null,
    logo: string|null,
    lowQuality: boolean,
    marketCapUsd: number,
    name: string,
    priceUsd: number|null,
    priceUsd7dAgo: number|null,
    priceUsd24hAgo: number|null,
    symbol: string,
    totalLiquidityUsd: number,
    trades24h: number|null,
    volume24hUsd: number|null,
    volume24hUsd24hAgo: number|null,
}
