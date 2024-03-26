import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { BitQueryService, QueuedTokenAddressService } from '../../service'
import { AddressResponse, BitQueryTransfersResponse } from '../../types'
import { Blockchain, findContractAddress } from '../../../utils'
import { AbstractParserWorker } from './AbstractParserWorker'

/**
 * @deprecated Not any more needed.
 */
@singleton()
export class BitQueryWorker extends AbstractParserWorker {
    private readonly workerName = 'BitQuery'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly supportedBlockchains: Blockchain[] =
        [
            Blockchain.ETH,
            Blockchain.BSC,
            Blockchain.CRO,
            Blockchain.MATIC,
            Blockchain.SOL,
        ]

    public constructor(
        private readonly bitQueryService: BitQueryService,
        private readonly queuedTokenAddressService: QueuedTokenAddressService,
        private readonly logger: Logger,
    ) {
        super()
    }

    public async run(): Promise<void> {
        for (const blockchain of this.supportedBlockchains) {
            await this.runByBlockchain(blockchain)
        }
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        this.logger.info(`${this.prefixLog} Checking ${currentBlockchain} blockchain`)

        const limit = 25000
        let offset = 0
        let fetchNext = true

        const blockchainParam = this.getBlockchainParam(currentBlockchain)
        let currentOffsetRetries = 0

        do {
            this.logger.info(`${this.prefixLog} Offset: ${offset} | Retries: ${currentOffsetRetries}`)

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

                    this.logger.info(`${this.prefixLog} Checking ${currentBlockchain} blockchain.`)
                    this.logger.warn(`${this.prefixLog} Failed to fetch all addresses for ${blockchainParam} with offset ${offset}. Reason: ${ex.message}. Skipping.`)
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

    private async checkAddresses(
        addresses: AddressResponse[],
        currentBlockchain: Blockchain,
        offset: number
    ): Promise<void> {
        let i = offset
        for (const address of addresses) {
            ++i

            const foundAddress = findContractAddress(address.currency.address)

            if (!foundAddress) {
                continue
            }

            await this.queuedTokenAddressService.push(foundAddress, currentBlockchain)

            this.logger.info(
                `${this.prefixLog} Pushed token address to queue service (${i}/${addresses.length + offset}):`,
                [ foundAddress, this.workerName, currentBlockchain ],
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
            case Blockchain.MATIC:
                return 'matic'
            case Blockchain.SOL:
                return 'solana'
            default:
                throw new Error(`Unsupported blockchain provided: ${currentBlockchain}. Blockchain param doesn't exist for the provided blockchain.`)
        }
    }
}
