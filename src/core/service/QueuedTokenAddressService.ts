import { QueuedTokenAddress } from '../entity'
import { singleton } from 'tsyringe'
import { QueuedTokenAddressRepository } from '../repository'
import { Blockchain } from '../../utils'
import { DuplicatesFoundService } from './DuplicatesFoundService'

@singleton()
export class QueuedTokenAddressService {
    public constructor(
        private readonly repository: QueuedTokenAddressRepository,
        private readonly duplicatesFoundService: DuplicatesFoundService,
    ) {}

    public async push(tokenAddress: string, blockchain: Blockchain): Promise<void> {
        const queueToken = await this.getToken(tokenAddress, blockchain)

        if (queueToken) {
            await this.duplicatesFoundService.increment(QueuedTokenAddressService.name)

            return
        }

        const token = new QueuedTokenAddress()
        token.tokenAddress = tokenAddress.toLowerCase()
        token.blockchain = blockchain
        token.isChecked = false

        await this.repository.insert(token)
    }

    public async getTokensToCheck(blockchain: Blockchain, amount: number): Promise<QueuedTokenAddress[]> {
        return this.repository.getUnchecked(blockchain, amount)
    }

    public async markAsChecked(token: QueuedTokenAddress): Promise<void> {
        token.isChecked = true
        await this.repository.save(token)
    }

    public async getToken(tokenAddress: string, blockchain: Blockchain): Promise<QueuedTokenAddress | undefined> {
        return this.repository.findOne({ tokenAddress: tokenAddress, blockchain: blockchain })
    }
}
