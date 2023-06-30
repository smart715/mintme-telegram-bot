export enum Blockchain {
    ETH = "ETH",
    BSC = "BSC",
    CRO = "CRO",
}

export function parseBlockchainName(name: string): Blockchain {
    if (["eth", "ethereum"].includes(name.toLowerCase())) {
        return Blockchain.ETH
    } else if (["bnb", "binance smart chain", "bsc", "binance"].includes(name.toLowerCase())) {
        return Blockchain.BSC
    } else if (["cro", "cronos"].includes(name.toLowerCase())) {
        return Blockchain.CRO
    }

    throw new Error("Unknown blockchain")
}