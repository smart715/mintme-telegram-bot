import { tokenAddressRegexp, walletAddressRegexp, Blockchain } from '../../../utils'
import { QueuedTokenAddressService, QueuedWalletAddressService } from '../../service'
import { singleton } from 'tsyringe'

@singleton()
export class ExplorerEnqueuer {
    private readonly tokenAddressPrefix = 'token/'
    private readonly walletAddressPrefix = 'address/'
    private readonly tokenAddressRegexp = this.tokenAddressPrefix + tokenAddressRegexp
    private readonly walletAddressRegexp = this.walletAddressPrefix + walletAddressRegexp

    public constructor(
        private readonly queuedTokenAddressService: QueuedTokenAddressService,
        private readonly queuedWalletAddressService: QueuedWalletAddressService,
    ) { }

    public async enqueuePageSrcTokenAddresses(pageSource: string, blockchain: Blockchain): Promise<void> {
        const tokenAddresses = this.getTokenAddresses(pageSource)

        await this.enqueueTokenAddresses(tokenAddresses, blockchain)
    }

    public async enqueuePageSrcWalletAddresses(pageSource: string, blockchain: Blockchain): Promise<void> {
        const walletAddresses = this.getWalletAddresses(pageSource)

        await this.enqueueWalletAddresses(walletAddresses, blockchain)
    }

    private getTokenAddresses(pageSource: string): string[] {
        const regexpMatch = pageSource
            .toLowerCase()
            .match(RegExp(this.tokenAddressRegexp, 'g')) ?? []
        const tokenAddresses = regexpMatch.map(tokenAddress => tokenAddress.replace(this.tokenAddressPrefix, ''))

        return tokenAddresses
    }

    private getWalletAddresses(pageSource: string): string[] {
        const regexpMatch = pageSource
            .toLowerCase()
            .match(RegExp(this.walletAddressRegexp, 'g')) ?? []
        const walletAddresses = regexpMatch.map(walletAddress => walletAddress.replace(this.walletAddressPrefix, ''))

        return walletAddresses
    }

    private removeDuplicates(addresses: string []): string[] {
        return addresses.filter((address, index) => addresses.indexOf(address) === index)
    }

    public async enqueueTokenAddresses(tokenAddresses: string[], blockchain: Blockchain): Promise<void> {
        const filteredAddresses = this.removeDuplicates(tokenAddresses)

        for (let i = 0; i < filteredAddresses.length; i++) {
            await this.queuedTokenAddressService.push(filteredAddresses[i], blockchain)
        }
    }

    public async enqueueWalletAddresses(walletAddresses: string[], blockchain: Blockchain): Promise<void> {
        const filteredAddresses = this.removeDuplicates(walletAddresses)

        for (let i = 0; i < filteredAddresses.length; i++) {
            await this.queuedWalletAddressService.push(filteredAddresses[i], blockchain)
        }
    }
}
