import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { QueuedWalletAddress } from '../entity'
import { Blockchain } from '../../utils'

@singleton()
@EntityRepository(QueuedWalletAddress)
export class QueuedWalletAddressRepository extends Repository<QueuedWalletAddress> {
    public async getUnchecked(blockchain: Blockchain, limit: number): Promise<QueuedWalletAddress[]> {
        return this.createQueryBuilder('queuedWalletAddress')
            .where('queuedWalletAddress.blockchain = :blockchain', { blockchain: blockchain })
            .andWhere('queuedWalletAddress.isChecked = false')
            .orderBy('queuedWalletAddress.id', 'ASC')
            .limit(limit)
            .getMany()
    }
}
