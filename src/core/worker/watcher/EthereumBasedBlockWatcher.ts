import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain, isForbiddenTokenName } from '../../../utils'
import config from 'config'
import { LastBlockService, QueuedTokenAddressService } from '../../service'
import { TransactionReceipt, Web3 } from 'web3'

interface BlockchainRpcHostInterface {
    [Blockchain.BSC]: string;
    [Blockchain.ETH]: string;
    [Blockchain.CRO]: string;
    [Blockchain.MATIC]: string;
    [Blockchain.SOL]: string;
}

@singleton()
export class EthereumBasedBlockWatcher {
    private readonly blockchainRpcList: BlockchainRpcHostInterface = config.get('blockchainRpcHost')
    private web3: Web3
    private isUpdatingBlocks: boolean = false
    private currentBlockchain: Blockchain
    private readonly supportedBlockchains = [
        Blockchain.ETH,
        Blockchain.BSC,
        Blockchain.CRO,
        Blockchain.MATIC,
    ]

    public constructor(
        private readonly lastBlockService: LastBlockService,
        private readonly queuedTokenAddressService: QueuedTokenAddressService,
        private readonly logger: Logger,
    ) {
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        if (!this.supportedBlockchains.includes(currentBlockchain)) {
            this.logger.warn('Unsupported Blockchain')
            return
        }

        this.currentBlockchain = currentBlockchain


        const rpcHost = this.blockchainRpcList[this.currentBlockchain]

        if (!rpcHost) {
            this.logger.error(`No Rpc host for blockchain ${this.currentBlockchain}`)
            return
        }

        this.logger.info(`Started block watcher for ${this.currentBlockchain} blockchain | Host: ${rpcHost}`)

        this.web3 = new Web3(rpcHost)

        await this.watch()
    }

    public async watch(): Promise<void> {
        this.updateToLastBlock()

        setInterval(
            () => this.updateToLastBlock(),
            3 * 60 * 1000
        )
    }

    public async updateToLastBlock(): Promise<void> {
        // try {
        const syncing = await this.web3.eth.isSyncing()

        if ('boolean' === typeof syncing) {
            if (!syncing) {
                if (this.isUpdatingBlocks) {
                    this.logger.warn(
                        `Watcher is still updating new blocks,` +
                            ` skipping regular calling`
                    )
                } else {
                    this.logger.info(`Starting syncing with ${this.currentBlockchain} node`)
                    await this.sync()
                }
            }
        } else {
            this.logger.info(
                `node is syncing now. 
                    ${syncing.currentBlock}/${syncing.highestBlock} blocks`
            )
        }
        /*} catch (error: any) {
            this.logger.error(`Error appeared during syncing: ${error}`)
        }*/
    }

    public async sync(): Promise<void> {
        const lastCheckedBlock = await this.lastBlockService.getOrCreateLastBlock(this.currentBlockchain)

        const lastBlockchainBlock: bigint = await this.web3.eth.getBlockNumber()
        let currentBlockHash = BigInt(lastCheckedBlock.blockHash)

        if (BigInt(0) === currentBlockHash) {
            currentBlockHash = lastBlockchainBlock - BigInt(1)
        }

        this.logger.info(`Updating from block ${currentBlockHash} to block ${lastBlockchainBlock}`)

        this.isUpdatingBlocks = true

        try {
            while (currentBlockHash < lastBlockchainBlock) {
                const block = await this.web3.eth.getBlock(++currentBlockHash, false)

                for (let i = 0; i < block.transactions.length; i++) {
                    const transaction = block.transactions[i]

                    if (!transaction) {
                        continue
                    }

                    if ('string' === typeof transaction) {
                        await this.checkTransaction(transaction)
                    } else {
                        await this.checkTransaction(transaction.hash)
                    }
                }

                lastCheckedBlock.blockHash = Number(currentBlockHash)
                await this.lastBlockService.updateLastBlock(lastCheckedBlock)
            }
        } finally {
            this.logger.info(` Last block updated to: ${currentBlockHash}`)
            this.isUpdatingBlocks = false
        }
    }

    private async checkTransaction(txHash: string): Promise<void> {
        this.logger.info(`checking tx ${txHash}`)

        try {
            const transaction: TransactionReceipt = await this.web3.eth.getTransactionReceipt(txHash)

            const logs = await transaction.logs
            const log = await logs.find(i => i.transactionHash === txHash)

            if (!log) {
                return
            }

            const abiJson = `[
                {
                    'constant': true,
                    'inputs': [],
                    'name': 'symbol',
                    'outputs': [
                        {
                            'name': '',
                            'type': 'string',
                        },
                    ],
                    'payable': false,
                    'stateMutability': 'view',
                    'type': 'function',
                },
                {
                    'constant': true,
                    'inputs': [],
                    'name': 'name',
                    'outputs': [
                        {
                            'name': '',
                            'type': 'string',
                        },
                    ],
                    'payable': false,
                    'stateMutability': 'view',
                    'type': 'function',
                },
            ]`

            const tokenAddress = log.address

            if (!tokenAddress) {
                return
            }

            const contract = new this.web3.eth.Contract(JSON.parse(abiJson), tokenAddress)
            const name = await contract.methods.name().call()
            const symbol = await contract.methods.symbol().call()
            const tokenName = `${name} (${symbol})`

            if (!isForbiddenTokenName(tokenName)) {
                this.queuedTokenAddressService.push(tokenAddress, this.currentBlockchain)
            }
        } catch (error) {
            this.logger.warn(`Couldn't get contract info, E: ${error}`)
        }
    }
}
