import { QueuedWalletAddress } from '../entity'
import { singleton } from 'tsyringe'
import { QueuedWalletAddressRepository } from '../repository'
import { Blockchain } from '../../utils'
import { DuplicatesFoundService } from './DuplicatesFoundService'

@singleton()
export class QueuedWalletAddressService {
    public constructor(
        private readonly repository: QueuedWalletAddressRepository,
        private readonly duplicatesFoundService: DuplicatesFoundService,
    ) {}

    public async push(walletAddress: string, blockchain: Blockchain): Promise<void> {
        const queueWallet = await this.getWallet(walletAddress, blockchain)

        if (queueWallet) {
            await this.duplicatesFoundService.increment(QueuedWalletAddressService.name)

            return
        }

        const wallet = new QueuedWalletAddress()
        wallet.walletAddress = Blockchain.SOL === blockchain ? walletAddress : walletAddress.toLowerCase()
        wallet.blockchain = blockchain
        wallet.isChecked = false

        await this.repository.insert(wallet)
    }

    public async getWalletsToCheck(blockchain: Blockchain, amount: number): Promise<QueuedWalletAddress[]> {
        return this.repository.getUnchecked(blockchain, amount)
    }

    public async getWallet(walletAddress: string, blockchain: Blockchain): Promise<QueuedWalletAddress | undefined> {
        return this.repository.findOne({ walletAddress: walletAddress, blockchain: blockchain })
    }

    public async markAsChecked(wallet: QueuedWalletAddress): Promise<void> {
        wallet.isChecked = true
        await this.repository.save(wallet)
    }
}
