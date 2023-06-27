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
};