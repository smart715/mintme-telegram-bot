import { singleton } from 'tsyringe'
import { AbstractTokenWorker } from '../AbstractTokenWorker'
import {Blockchain, findContractAddress, logger} from '../../../utils'
import { BitQueryService } from '../../service/parser/BitQueryService'
import { QueuedTokenAddressService } from '../../service'
import {AddressResponse, BitQueryTransfersResponse} from "../../../types";

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

            const addresses = allAddressesRes.data.ethereum.transfers

            if (0 === addresses.length) {
                fetchNext = false

                continue
            }

            await this.checkAddresses(addresses, currentBlockchain)
        } while (fetchNext)
    }

    private async checkAddresses(addresses: AddressResponse[], currentBlockchain: Blockchain): Promise<void> {
        for (const address of addresses) {
            const foundAddress = findContractAddress(address.currency.address)

            if (!foundAddress) {
                continue
            }

            await this.queuedTokenAddressService.push(foundAddress, currentBlockchain)

            logger.info(
                `${this.prefixLog} Pushed token address to queue service:`,
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
