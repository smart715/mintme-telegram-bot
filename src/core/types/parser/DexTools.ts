export interface DexToolsAllTokensResponse {
    totalPages: number,
    page: number,
    pageSize: number,
    tokens: DexToolsTokenInfo[]
}

export interface DexToolsTokenInfo {
    address: string,
    name: string,
    symbol: string,
    decimals: number
    socialInfo: {[key: string]: string},
    creationTime: Date,
    creationBlock: number
}
