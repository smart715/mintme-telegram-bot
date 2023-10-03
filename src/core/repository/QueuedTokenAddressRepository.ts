import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { QueuedTokenAddress } from '../entity'
import { Blockchain } from '../../utils'

@singleton()
@EntityRepository(QueuedTokenAddress)
export class QueuedTokenAddressRepository extends Repository<QueuedTokenAddress> {
    public async getUnchecked(blockchain: Blockchain|null, limit: number): Promise<QueuedTokenAddress[]> {
        const queryBuilder = this.createQueryBuilder('queuedTokenAddress')
            .where('queuedTokenAddress.isChecked = false')

        if (blockchain) {
            queryBuilder.andWhere('queuedTokenAddress.blockchain = :blockchain', { blockchain: blockchain })
        }

        return queryBuilder
            .orderBy('queuedTokenAddress.id', 'ASC')
            .limit(limit)
            .getMany()
    }
}
