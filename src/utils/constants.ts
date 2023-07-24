import { Blockchain } from '.'

export const tokenAddressRegexp = '0x[a-z0-9]{1,50}'
export const walletAddressRegexp = '0x[a-z0-9]{1,50}'

export const explorerDomains = {
    [Blockchain.BSC]: 'bscscan.com',
    [Blockchain.ETH]: 'etherscan.io',
    [Blockchain.CRO]: 'cronoscan.com',
}
