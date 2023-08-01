export interface CoinGeckoAllCoinsResponse {
    keywords: string[],
    name: string,
    timestamp: string,
    tokens: AllCoinsTokenResponse[],
}

export interface AllCoinsTokenResponse {
    address: string,
    chainId: number,
    decimals: number,
    logoURI: string,
    name: string,
    symbol: string,
}

export interface CoinInfo {
    id: string,
    name: string,
    symbol: string,
    platforms: object,
    links: LinksCoinInfo,
}

export interface LinksCoinInfo {
    homepage: string[],
    blockchain_site: string[],
    official_forum_url: string[],
    chat_url: string[],
    announcement_url: string[],
    twitter_screen_name: string|null,
    facebook_username: string|null,
    bitcointalk_thread_identifier: string|null,
    telegram_channel_identifier: string|null,
    subreddit_url: string|null,
    repos_url: object,
}
