import { explorerDomains } from '.'

export enum Blockchain {
    ETH = 'ETH',
    BSC = 'BSC',
    CRO = 'CRO',
    MATIC = 'MATIC',
    SOL = 'SOL',
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
    const maticNames = [ 'polygon', 'matic', 'polygon poS chain' ]
    const solNames = [ 'solana', 'sol' ]

    if (ethNames.includes(name.toLowerCase())) {
        return Blockchain.ETH
    } else if (bscNames.includes(name.toLowerCase())) {
        return Blockchain.BSC
    } else if (croNames.includes(name.toLowerCase())) {
        return Blockchain.CRO
    } else if (maticNames.includes(name.toLowerCase())) {
        return Blockchain.MATIC
    } else if (solNames.includes(name.toLowerCase())) {
        return Blockchain.SOL
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
        MATIC: [ 'polygon', 'matic', 'polygon poS chain' ],
        SOL: [ 'solana', 'sol' ],
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


export function findContractAddress(source: string): string|null {
    const addresses = source.match('0x[a-fA-F0-9]{40}')

    return addresses && addresses.length > 0
        ? addresses[0]
        : null
}
