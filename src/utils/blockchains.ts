import { explorerDomains } from '.'

export enum Blockchain {
    ETH = 'ETH',
    BSC = 'BSC',
    CRO = 'CRO',
    MATIC = 'MATIC',
    SOL = 'SOL',
    AVAX = 'AVAX',
    ARB = 'ARB',
    BASE = 'BASE',
}

export function parseBlockchainName(name: string): Blockchain {
    const ethNames = [ 'eth', 'ethereum' ]
    const croNames = [ 'cro', 'cronos' ]
    const bscNames = [
        'bnb',
        'binance smart chain',
        'binance chain',
        'bnb smart chain (bep20)',
        'bsc',
        'binance',
    ]
    const maticNames = [
        'polygon',
        'matic',
        'polygon poS chain',
        'polygon-pos',
    ]
    const solNames = [ 'solana', 'sol' ]
    const avaxNames = [ 'avalanche', 'avax', 'c-chain' ]
    const arbNames = [ 'arbitrum', 'arbitrum-one', 'arb' ]
    const baseNames = [ 'base' ]

    const tokenNameLowerCase = name.toLowerCase()

    if (ethNames.includes(tokenNameLowerCase)) {
        return Blockchain.ETH
    } else if (bscNames.includes(tokenNameLowerCase)) {
        return Blockchain.BSC
    } else if (croNames.includes(tokenNameLowerCase)) {
        return Blockchain.CRO
    } else if (maticNames.includes(tokenNameLowerCase)) {
        return Blockchain.MATIC
    } else if (solNames.includes(tokenNameLowerCase)) {
        return Blockchain.SOL
    } else if (avaxNames.includes(tokenNameLowerCase)) {
        return Blockchain.AVAX
    } else if (arbNames.includes(tokenNameLowerCase)) {
        return Blockchain.ARB
    } else if (baseNames.includes(tokenNameLowerCase)) {
        return Blockchain.BASE
    }

    throw new Error('Unknown blockchain')
}

export function getBlockchainFromContent(content: string): Blockchain|null {
    const blockchainsKeyWords: { [bc: string]: string[] } = {
        BSC: [
            'bnb',
            'binance smart chain',
            'binance chain',
            'bnb smart chain (bep20)',
            'bsc',
            'binance',
            'bscscan',
        ],
        ETH: [ 'eth', 'ethereum', 'etherscan' ],
        CRO: [ 'cro', 'cronos' ],
        MATIC: [
            'polygon',
            'matic',
            'polygon poS chain',
            'polygon-pos',
        ],
        SOL: [ 'solana', 'sol' ],
        AVAX: [ 'avalanche', 'avax', 'c-chain' ],
        ARB: [
            'arbitrum',
            'arbitrum-one',
            'arbitrum-ecosystem',
            'arb',
        ],
        BASE: [ 'base' ],
    }

    for (const blockchain in blockchainsKeyWords) {
        const regexPattern = new RegExp(blockchainsKeyWords[blockchain].join('|'), 'i')
        const regexMatches = content.match(regexPattern)

        if (regexMatches) {
            return Blockchain[blockchain as keyof typeof Blockchain]
        }
    }

    return null
}

export function getBlockchainByExplorerUrl(link: string): Blockchain|null {
    for (const blockchain of Object.keys(explorerDomains)) {
        const typeBc: Blockchain = Blockchain[blockchain as keyof typeof Blockchain]

        if (link.includes(explorerDomains[typeBc])) {
            return typeBc
        }
    }

    return null
}

export function getBlockchainByEvmChainId(chainId: number): Blockchain|null {
    switch (chainId) {
        case 56:
            return Blockchain.BSC
        case 1:
            return Blockchain.ETH
        case 137:
            return Blockchain.MATIC
        case 25:
            return Blockchain.CRO
        case 42161:
            return Blockchain.ARB
        case 43114:
            return Blockchain.AVAX
        case 8453:
            return Blockchain.BASE
        default:
            return null
    }
}


export function findContractAddress(source: string): string|null {
    const addresses = source.match('0x[a-fA-F0-9]{40}')

    return addresses && addresses.length > 0
        ? addresses[0]
        : null
}
