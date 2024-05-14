export interface DexToolsAllTokensResponse {
    totalPages: number,
    page: number,
    pageSize: number,
    results: DexToolsTokenResponse[]
}

export interface DexToolsTokenResponse {
    address: string,
    name: string,
    symbol: string,
    decimals: number
    socialInfo: {[key: string]: string},
    creationTime: Date,
    creationBlock: number
}
