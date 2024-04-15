import { Blockchain } from '.'

export const tokenAddressRegexp = '0x[a-z0-9]{1,50}'
export const walletAddressRegexp = '0x[a-z0-9]{1,50}'

export const explorerDomains = {
    [Blockchain.BSC]: 'bscscan.com',
    [Blockchain.ETH]: 'etherscan.io',
    [Blockchain.CRO]: 'cronoscan.com',
    [Blockchain.MATIC]: 'polygonscan.com',
    [Blockchain.SOL]: 'solscan.io',
    [Blockchain.AVAX]: 'snowtrace.io',
    [Blockchain.ARB]: 'arbiscan.io',
    [Blockchain.BASE]: 'basescan.org',
}

export const explorerApiUrls = {
    [Blockchain.BSC]: 'api.bscscan.com',
    [Blockchain.ETH]: 'api.etherscan.io',
    [Blockchain.CRO]: 'api.cronoscan.com',
    [Blockchain.MATIC]: 'api.polygonscan.com',
    [Blockchain.SOL]: 'pro-api.solscan.io/v1.0/',
    [Blockchain.AVAX]: 'api.routescan.io/v2/network/mainnet/evm/43114',
    [Blockchain.ARB]: 'api.arbiscan.io',
    [Blockchain.BASE]: 'api.basescan.org',
}

export enum Environment {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
}
