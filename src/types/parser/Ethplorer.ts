export interface EthprolerTokenInfoResponse {
    isContract: boolean,
    transfers: EthprolerTransfer[],
    contract: {
        address: string,
        creator: string,
        hash: string,
        timestamp: number,
        blockNumber: number,
        txsCount: number
    },
    token: EthprolerToken,
    pager: EthprolerPager,
}

interface EthprolerTransfer {
    timestamp: number,
    transactionHash: string,
    blockNumber: number,
    addresses: [],
    from: string,
    to: string,
    contract: string,
    value: string,
    intValue: number,
    type: string,
    priority: number,
    status: number,
    isEth: boolean,
    usdPrice: number,
}

interface EthprolerToken {
    address: string,
    name: string,
    decimals: string,
    symbol: string,
    totalSupply: string,
    owner: string,
    txsCount: number,
    transfersCount: number,
    lastUpdated: number,
    slot: number,
    countsUpdated: boolean,
    issuancesCount: number,
    price: {
        rate: number,
        diff: number,
        diff7d: number,
        ts: number,
        marketCapUsd: number,
        availableSupply: number,
        volume24h: number,
        volDiff1: number,
        volDiff7: number,
        volDiff30: number,
        diff30d: number,
        bid: number,
        currency: string,
    },
    holdersCount: number,
    image: string,
    website: string,
    telegram: string,
    facebook: string,
    coingecko: string,
    twitter: string,
    reddit: string,
    ethTransfersCount: number,
    ts: number
}

interface EthprolerPager {
    pageSize: number,
    transfers: {
        page: number,
        records: number,
        total: number,
    },
    balance: number,
    balanceOut: number,
    balanceIn: number,
    ethPrice: {
        rate: number,
        diff: number,
        diff7d: number,
        ts: number,
        marketCapUsd: number,
        availableSupply: number,
        volume24h: number,
        volDiff1: number,
        volDiff7: number,
        volDiff30: number,
        diff30d: number,
    },
}