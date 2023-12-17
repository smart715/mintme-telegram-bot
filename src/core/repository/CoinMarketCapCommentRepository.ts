import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { CoinMarketCapComment } from '../entity'

@singleton()
@EntityRepository(CoinMarketCapComment)
export class CoinMarketCapCommentRepository extends Repository<CoinMarketCapComment> {
    public async getRandomComment(): Promise<CoinMarketCapComment | undefined> {
        return this.createQueryBuilder()
            .orderBy('RAND()')
            .getOne()
    }
}
