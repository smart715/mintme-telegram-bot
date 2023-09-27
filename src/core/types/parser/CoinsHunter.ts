/* eslint-disable @typescript-eslint/naming-convention */

export interface CoinsHunterToken {
    coin_id: string,
    address: string,
    name: string,
    symbol: string,
    chain: string,
    social_info: {
        website: string,
        telegram: string,
        twitter: string,
        facebook: string,
        reddit: string,
    },
    contact_info: {
        telegram: string,
        email: string,
    },
}
