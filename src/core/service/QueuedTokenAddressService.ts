import { QueuedTokenAddress } from '../entity'
import { singleton } from 'tsyringe'
import { QueuedTokenAddressRepository } from '../repository'
import { Blockchain } from '../../utils'
import { DuplicatesFoundService } from './DuplicatesFoundService'
import { TokensService } from '../service'

@singleton()
export class QueuedTokenAddressService {
    public constructor(
        private readonly repository: QueuedTokenAddressRepository,
        private readonly duplicatesFoundService: DuplicatesFoundService,
        private readonly tokensService: TokensService,
    ) {}

    public async push(tokenAddress: string, blockchain: Blockchain): Promise<void> {
        const queueToken = await this.getToken(tokenAddress)
        const token = await this.tokensService.findByAddress(tokenAddress)

        if (queueToken || token) {
            await this.duplicatesFoundService.increment(QueuedTokenAddressService.name)

            return
        }

        const queuedToken = new QueuedTokenAddress()
        queuedToken.tokenAddress = tokenAddress.toLowerCase()
        queuedToken.blockchain = blockchain
        queuedToken.isChecked = false

        await this.repository.insert(queuedToken)
    }

    public async getTokensToCheck(blockchains: Blockchain[], amount: number): Promise<QueuedTokenAddress[]> {
        return this.repository.getUnchecked(blockchains, amount)
    }

    public async markAsChecked(token: QueuedTokenAddress): Promise<void> {
        token.isChecked = true
        await this.repository.save(token)
    }

    public async getToken(tokenAddress: string): Promise<QueuedTokenAddress | undefined> {
        return this.repository.findOne({ tokenAddress: tokenAddress })
    }
}
