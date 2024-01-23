import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { QueuedTokenAddress } from '../entity'
import { Blockchain } from '../../utils'

@singleton()
@EntityRepository(QueuedTokenAddress)
export class QueuedTokenAddressRepository extends Repository<QueuedTokenAddress> {
    public async getUnchecked(blockchains: Blockchain[], limit: number): Promise<QueuedTokenAddress[]> {
        return this.createQueryBuilder('queuedTokenAddress')
            .where('queuedTokenAddress.isChecked = false')
            .andWhere('queuedTokenAddress.blockchain IN (:blockchains)', { blockchains })
            .orderBy('queuedTokenAddress.id', 'ASC')
            .limit(limit)
            .getMany()
    }
}
