import { singleton } from 'tsyringe'
import { TokenCachedDataRepository } from '../repository'
import { TokenCachedData } from '../entity'

@singleton()
export class TokenCachedDataService {
    public constructor(
        private tokenCachedDataRepository: TokenCachedDataRepository
    ) {}

    public async getIdsBySource(source: string): Promise<TokenCachedData[]> {
        return this.tokenCachedDataRepository.findIdsBySource(source)
    }

    public async cacheTokenData(tokenId: string, source: string, data: string): Promise<TokenCachedData> {
        const tokenCachedData = new TokenCachedData(tokenId, source, data)

        await this.tokenCachedDataRepository.save(tokenCachedData)

        return tokenCachedData
    }

    public async isCached(tokenId: string, source: string): Promise<boolean> {
        const tokens = await this.tokenCachedDataRepository.count({ tokenId, source })

        return tokens > 0
    }
}
