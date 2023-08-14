export interface TokensInsightAllCoinsResponse {
    status: {
        code: number,
        messsage: string,
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
