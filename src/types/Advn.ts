/* eslint-disable @typescript-eslint/naming-convention */

export interface AdvnGeneralResponse {
    data: AdvnToken[],
    draw: number,
    recordsFiltered: number,
    recordsTotal: number,
    status: string,
}


interface AdvnToken {
    avg_7_day_volume_trend: number,
    change: string[],
    change_percentage_numeric: number,
    chart_url: string,
    crypto_link: string,
    logo: string,
    market_cap: string,
    name_symbol: string[],
    platform: string|null,
    price_numeric: string,
    volume_24h: string,
    volume_24h_abbreviated: string,
    volume_trend: number,
}
