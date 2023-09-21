export enum Blockchain {
    ETH = 'ETH',
    BSC = 'BSC',
    CRO = 'CRO',
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

    if (ethNames.includes(name.toLowerCase())) {
        return Blockchain.ETH
    } else if (bscNames.includes(name.toLowerCase())) {
        return Blockchain.BSC
    } else if (croNames.includes(name.toLowerCase())) {
        return Blockchain.CRO
    }

    throw new Error('Unknown blockchain')
}

export function findContractAddress(source: string): string|null {
    const addresses = source.match('0x[a-fA-F0-9]{40}')

    return addresses && addresses.length > 0
        ? addresses[0]
        : null
}
