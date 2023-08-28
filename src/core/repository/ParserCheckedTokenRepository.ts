import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { ParserCheckedToken } from '../entity'

@singleton()
@EntityRepository(ParserCheckedToken)
export class ParserCheckedTokenRepository extends Repository<ParserCheckedToken> {
    public async findIdsBySource(source: string): Promise<ParserCheckedToken[]> {
        return this.createQueryBuilder().where({ source }).select('token_id').getRawMany()
    }
}
