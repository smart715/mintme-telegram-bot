/* eslint-disable @typescript-eslint/naming-convention */

export interface CoinCatapultAllCoinsResponse {
    error_code: {
        code: number,
        message: string,
    },
    response: CoinCatapultCoin[],
}

export interface CoinCatapultCoin {
    created_at: string,
    featured: string|null,
    id: number,
    image: string|null,
    launch: string,
    launch_date: string,
    logo: string,
    name: string,
    network: string|null,
    slug: string,
    status: number,
    symbol: string,
    tmp: string[],
    votes: number,
    votesToday: number,
}

export interface CoinCatapultTokenInfoGeneralResponse {
    error_code: {
        code: number,
        message: string,
    },
    response: CoinCatapultTokenInfoObject
}

export interface CoinCatapultTokenInfoObject {
    charts: [],
    contract: string|null,
    created_at: string,
    description: string|null,
    exchanges: [],
    featured: string|null,
    id: number,
    image: string|null,
    launch: string,
    launch_date: string,
    logo: string,
    meta: object,
    name: string,
    network: string,
    slug: string,
    social: {
        website: string,
        email: string|undefined|null,
        twitter: string|undefined|null,
        telegram: string|undefined|null,
        instagram: string|undefined|null,
        facebook: string|undefined|null,
    },
    tmp: object,
    votes: number,
    votesToday: number,
}
