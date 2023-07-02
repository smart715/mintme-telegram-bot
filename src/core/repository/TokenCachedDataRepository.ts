import { singleton } from "tsyringe"
import { EntityRepository, Repository } from "typeorm"
import { TokenCachedData } from "../entity/TokenCachedData"

@singleton()
@EntityRepository(TokenCachedData)
export class TokenCachedDataRepository extends Repository<TokenCachedData> {
    public async findIdsBySource(source: string): Promise<TokenCachedData[]> {
        return await this.createQueryBuilder().where({source}).select('token_id').getRawMany()
    }
}
