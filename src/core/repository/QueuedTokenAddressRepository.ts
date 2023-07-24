import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { QueuedTokenAddress } from '../entity'
import { Blockchain } from '../../utils'

@singleton()
@EntityRepository(QueuedTokenAddress)
export class QueuedTokenAddressRepository extends Repository<QueuedTokenAddress> {
    public async getUnchecked(blockchain: Blockchain, limit: number): Promise<QueuedTokenAddress[]> {
        return this.createQueryBuilder('tokenQueue')
            .where('tokenQueue.blockchain = :blockchain', { blockchain: blockchain })
            .andWhere('tokenQueue.isChecked = false')
            .orderBy('tokenQueue.id', 'ASC')
            .limit(limit)
            .getMany()
    }
}
