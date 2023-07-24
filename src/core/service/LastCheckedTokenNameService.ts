import { LastCheckedTokenNameRepository } from '../repository'
import { LastCheckedTokenName } from '../entity'
import { Blockchain } from '../../utils'

export class LastCheckedTokenNameService {
    public constructor(
        private readonly lastCheckedTokenNameRepository: LastCheckedTokenNameRepository
    ) { }

    public async getLastCheckedTokenName(
        source: string,
        blockchain: Blockchain
    ): Promise<LastCheckedTokenName | undefined> {
        return this.lastCheckedTokenNameRepository.findOne({ source, blockchain })
    }

    public async save(source: string, blockchain: Blockchain, tokenNameCombination: string): Promise<void> {
        const lastCheckedTokenName = await this.getLastCheckedTokenName(source, blockchain)

        if (!lastCheckedTokenName) {
            await this.insert(source, blockchain, tokenNameCombination)

            return
        }

        lastCheckedTokenName.tokenName = tokenNameCombination
        await this.lastCheckedTokenNameRepository.save(lastCheckedTokenName)
    }

    private async insert(source: string, blockchain: Blockchain, tokenNameCombination: string): Promise<void> {
        const lastCheckedTokenName = new LastCheckedTokenName()
        lastCheckedTokenName.source = source
        lastCheckedTokenName.blockchain = blockchain
        lastCheckedTokenName.tokenName = tokenNameCombination

        await this.lastCheckedTokenNameRepository.insert(lastCheckedTokenName)
    }
}
