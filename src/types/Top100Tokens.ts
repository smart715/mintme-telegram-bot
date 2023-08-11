/* eslint-disable @typescript-eslint/naming-convention */

export interface Top100TokensTopListResponse {
    status: string,
    _data: {
        toplist: Top100TokensToken[],
    }
}

export interface Top100TokensToken {
    id: number;
    isNFT: number;
    image: string;
    contract: string;
    name: string;
    symbol: string;
    network: string;
    websiteLink: string;
    launchDate: string;
    voteDaily: number;
    voteTotal: number;
    marketCap: number;
    telegram: string | null;
    discord: string | null;
    twitter: string | null;
    reddit: string | null;
    isScam: number;
    cgSlug: string | null;
    cmcSlug: string | null;
    slug: string;
    telegramCount: number | null;
    twitterCount: number | null;
    lpUsdValue: number;
    price1hChange: number;
    price24hChange: number;
    txCount1h: number;
    volume1h: number;
    txCount24h: number;
    volume24h: number;
    pairCreatedAt: string;
    priceUsd: number;
}
