import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { QueuedWalletAddress } from '../entity'
import { Blockchain } from '../../utils'

@singleton()
@EntityRepository(QueuedWalletAddress)
export class QueuedWalletAddressRepository extends Repository<QueuedWalletAddress> {
    public async getUnchecked(blockchain: Blockchain, limit: number): Promise<QueuedWalletAddress[]> {
        return this.createQueryBuilder('walletQueue')
            .where('walletQueue.blockchain = :blockchain', { blockchain: blockchain })
            .andWhere('walletQueue.isChecked = false')
            .orderBy('walletQueue.id', 'ASC')
            .limit(limit)
            .getMany()
    }
}
