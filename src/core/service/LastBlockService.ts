import { LastBlockRepository } from '../repository'
import { LastBlock } from '../entity'
import { Blockchain } from '../../utils'

export class LastBlockService {
    public constructor(
        private readonly lastBlockRepository: LastBlockRepository
    ) { }

    public async getLastBlock(blockchain: Blockchain): Promise<LastBlock|undefined> {
        return this.lastBlockRepository.findOne({ blockchain })
    }

    public async getOrCreateLastBlock(blockchain: Blockchain): Promise<LastBlock> {
        const lastBlock = await this.getLastBlock(blockchain)

        return lastBlock
            ? lastBlock
            : this.lastBlockRepository.save(new LastBlock(blockchain))
    }

    public async updateLastBlock(lastBlock: LastBlock): Promise<LastBlock> {
        return this.lastBlockRepository.save(lastBlock)
    }
}
