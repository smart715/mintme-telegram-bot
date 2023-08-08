import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { QueuedTokenAddressService, BitQueryService } from '../../service'
import { AddressResponse, BitQueryTransfersResponse } from '../../../types'
import { Blockchain, findContractAddress, logger } from '../../../utils'

@singleton()
export class BitQueryWorker extends AbstractTokenWorker {
    private readonly prefixLog = '[BitQuery]'

    public constructor(
        private readonly bitQueryService: BitQueryService,
        private readonly queuedTokenAddressService: QueuedTokenAddressService
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        const limit = 25000
        let offset = 0
        let fetchNext = true

        const blockchainParam = this.getBlockchainParam(currentBlockchain)
        let currentOffsetRetries = 0

        do {
            logger.info(`${this.prefixLog} Offset: ${offset} | Retries: ${currentOffsetRetries}`)

            // prevent infinite loop
            if (offset >= 100000000) {
                fetchNext = false

                continue
            }
            
            let allAddressesRes: BitQueryTransfersResponse
            
            try {
                allAddressesRes = await this.bitQueryService.getAddresses(offset, limit, blockchainParam)
            } catch (ex: any) {
                if (currentOffsetRetries < 3) {
                    ++currentOffsetRetries
                } else {
                    currentOffsetRetries = 0
                    offset += 25000
                    
                    logger.warn(`${this.prefixLog} Failed to fetch all addresses for ${blockchainParam} with offset ${offset}. Reason: ${ex.message}. Skipping.`)
                }
                
                continue
            }

            if (allAddressesRes.errors) {
                if (currentOffsetRetries < 3) {
                    ++currentOffsetRetries
                } else {
                    currentOffsetRetries = 0
                    offset += 25000
                }

                continue
            }

            const addresses = allAddressesRes.data.ethereum.transfers

            if (0 === addresses.length) {
                fetchNext = false

                continue
            }

            await this.checkAddresses(addresses, currentBlockchain, offset)

            currentOffsetRetries = 0
            offset += 25000
        } while (fetchNext)
    }

    private async checkAddresses(addresses: AddressResponse[], currentBlockchain: Blockchain, offset: number): Promise<void> {
        let i = offset
        for (const address of addresses) {
            ++i

            const foundAddress = findContractAddress(address.currency.address)

            if (!foundAddress) {
                continue
            }

            await this.queuedTokenAddressService.push(foundAddress, currentBlockchain)

            logger.info(
                `${this.prefixLog} Pushed token address to queue service (${i}/${addresses.length + offset}:`,
                foundAddress,
                'BitQuery',
                currentBlockchain
            )
        }
    }

    private getBlockchainParam(currentBlockchain: Blockchain): string {
        switch (currentBlockchain) {
            case Blockchain.ETH:
                return 'ethereum'
            case Blockchain.BSC:
                return 'bsc'
            case Blockchain.CRO:
                return 'cronos'
            default:
                throw new Error('Wrong blockchain provided. Blockchain param doesn\'t exists for provided blockchain')
        }
    }
}
