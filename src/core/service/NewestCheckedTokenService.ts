import { NewestCheckedTokenRepository } from '../repository'
import { NewestCheckedToken } from '../entity'
import { singleton } from 'tsyringe'
import { Blockchain } from '../../utils'

@singleton()
export class NewestCheckedTokenService {
    public constructor(
        private readonly newestCheckedTokenRepository: NewestCheckedTokenRepository
    ) { }

    public async findOne(workerName: string, blockchain: Blockchain|null): Promise<NewestCheckedToken | undefined> {
        return this.newestCheckedTokenRepository.findOne({
            workerName,
            blockchain,
        })
    }

    public async getTokenId(workerName: string, blockchain: Blockchain|null): Promise<string | null> {
        const newestCheckedToken = await this.findOne(workerName, blockchain)

        return newestCheckedToken?.tokenId ?? null
    }

    public async save(workerName: string, tokenId: string, blockchain: Blockchain|null = null): Promise<void> {
        const newestCheckedToken = await this.findOne(workerName, blockchain)

        if (!newestCheckedToken) {
            await this.insert(workerName, tokenId, blockchain)

            return
        }

        newestCheckedToken.tokenId = tokenId
        await this.newestCheckedTokenRepository.save(newestCheckedToken)
    }

    private async insert(workerName: string, tokenId: string, blockchain: Blockchain|null = null): Promise<void> {
        const lastCheckedTokenName = new NewestCheckedToken()
        lastCheckedTokenName.workerName = workerName
        lastCheckedTokenName.tokenId = tokenId
        lastCheckedTokenName.blockchain = blockchain

        await this.newestCheckedTokenRepository.insert(lastCheckedTokenName)
    }
}
