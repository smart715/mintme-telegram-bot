import { Blockchain } from '../utils'

export interface TokensCountGroupedBySource {
    tokens: string,
    source: string,
    blockchain: Blockchain
}
