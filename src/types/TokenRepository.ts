import { Blockchain } from '../utils'

export interface TokensCountGroupedBySourceAndBlockchain{
    tokens: number,
    blockchain: Blockchain,
    source: string,
}
