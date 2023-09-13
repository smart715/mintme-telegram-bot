import { Blockchain } from '../utils'

export interface TokensCountGroupedBySourceAndBlockchain {
    tokens: string,
    source: string,
    blockchain: Blockchain
}
