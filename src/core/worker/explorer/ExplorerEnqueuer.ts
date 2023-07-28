import { tokenAddressRegexp, walletAddressRegexp, Blockchain } from '../../../utils'
import { QueuedTokenAddressService, QueuedWalletAddressService } from '../../service'
import { singleton } from 'tsyringe'

@singleton()
export class ExplorerEnqueuer {
    private readonly tokenAddressPrefix = 'token/'
    private readonly walletAddressPrefix = 'token/'
    private readonly tokenAddressRegexp = this.tokenAddressPrefix + tokenAddressRegexp
    private readonly walletAddressRegexp = this.walletAddressPrefix + walletAddressRegexp

    public constructor(
        private readonly queuedTokenAddressService: QueuedTokenAddressService,
        private readonly queuedWalletAddressService: QueuedWalletAddressService,
    ) { }

    public async enqueueTokenAddresses(pageSource: string, blockchain: Blockchain): Promise<void> {
        const tokenAddresses = this.getTokenAddresses(pageSource)

        for (let i = 0; i < tokenAddresses.length; i++) {
            await this.queuedTokenAddressService.push(tokenAddresses[i], blockchain)
        }
    }

    public async enqueueWalletAddresses(pageSource: string, blockchain: Blockchain): Promise<void> {
        const walletAddresses = this.getWalletAddresses(pageSource)

        for (let i = 0; i < walletAddresses.length; i++) {
            await this.queuedWalletAddressService.push(walletAddresses[i], blockchain)
        }
    }

    private getTokenAddresses(pageSource: string): string[] {
        const regexpMatch = pageSource
            .toLowerCase()
            .match(RegExp(this.tokenAddressRegexp, 'g')) ?? []
        const walletAddresses = regexpMatch.map(walletAddress => walletAddress.replace(this.tokenAddressPrefix, ''))

        return this.removeDuplicates(walletAddresses)
    }

    private getWalletAddresses(pageSource: string): string[] {
        const regexpMatch = pageSource
            .toLowerCase()
            .match(RegExp(this.walletAddressRegexp, 'g')) ?? []
        const walletAddresses = regexpMatch.map(walletAddress => walletAddress.replace(this.walletAddressPrefix, ''))

        return this.removeDuplicates(walletAddresses)
    }

    private removeDuplicates(addresses: string []): string[] {
        return addresses.filter((address, index) => addresses.indexOf(address) === index)
    }
}
