import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { QueuedTokenAddress } from '../entity'
import { Blockchain } from '../../utils'

@singleton()
@EntityRepository(QueuedTokenAddress)
export class QueuedTokenAddressRepository extends Repository<QueuedTokenAddress> {
    public async getUnchecked(blockchain: Blockchain|null, limit: number): Promise<QueuedTokenAddress[]> {
        const queryBuilder = this.createQueryBuilder('tokenQueue')
            .where('tokenQueue.isChecked = false')

        if (blockchain) {
            queryBuilder.andWhere('tokenQueue.blockchain = :blockchain', { blockchain: blockchain })
        }

        return queryBuilder
            .orderBy('tokenQueue.id', 'ASC')
            .limit(limit)
            .getMany()
    }
}
