import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { CoinMarketCapComment } from '../entity'

@singleton()
@EntityRepository(CoinMarketCapComment)
export class CoinMarketCapCommentRepository extends Repository<CoinMarketCapComment> {
    public async getRandomComment(excludedIds: number[]): Promise<CoinMarketCapComment | undefined> {
        const qryBuilder = this.createQueryBuilder()
            .orderBy('RAND()')

        if (excludedIds.length) {
            qryBuilder.where('id NOT IN (:excludedIds)', { excludedIds })
        }

        return qryBuilder.getOne()
    }
}
