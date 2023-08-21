import { NewestCheckedTokenRepository } from '../repository'
import { NewestCheckedToken } from '../entity'
import { singleton } from 'tsyringe'

@singleton()
export class NewestCheckedTokenService {
    public constructor(
        private readonly newestCheckedTokenRepository: NewestCheckedTokenRepository
    ) { }

    public async findOne(workerName: string): Promise<NewestCheckedToken | undefined> {
        return this.newestCheckedTokenRepository.findOne({ workerName })
    }

    public async getTokenId(workerName: string): Promise<string | null> {
        const newestCheckedToken = await this.findOne(workerName)

        return newestCheckedToken?.tokenId ?? null
    }

    public async save(workerName: string, tokenId: string): Promise<void> {
        const newestCheckedToken = await this.findOne(workerName)

        if (!newestCheckedToken) {
            await this.insert(workerName, tokenId)

            return
        }

        newestCheckedToken.tokenId = tokenId
        await this.newestCheckedTokenRepository.save(newestCheckedToken)
    }

    private async insert(workerName: string, tokenId: string): Promise<void> {
        const lastCheckedTokenName = new NewestCheckedToken()
        lastCheckedTokenName.workerName = workerName
        lastCheckedTokenName.tokenId = tokenId

        await this.newestCheckedTokenRepository.insert(lastCheckedTokenName)
    }
}
