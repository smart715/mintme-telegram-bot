import { singleton } from 'tsyringe'
import { Logger } from 'winston'
import { Blockchain, isForbiddenTokenName, sleep } from '../../../utils'
import config from 'config'
import { LastBlockService, QueuedTokenAddressService } from '../../service'
import { TransactionReceipt, Web3 } from 'web3'
import { LastBlock } from '../../entity'

interface BlockchainRpcHostInterface {
    [Blockchain:string]: string
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
        Blockchain.ARB,
        Blockchain.AVAX,
    ]

    public constructor(
        private readonly lastBlockService: LastBlockService,
        private readonly queuedTokenAddressService: QueuedTokenAddressService,
        private readonly logger: Logger,
    ) {
    }

    public async runByBlockchain(currentBlockchain: Blockchain): Promise<void> {
        if (!this.supportedBlockchains.includes(currentBlockchain)) {
            this.logger.warn(`Unsupported Blockchain: ${currentBlockchain}`)
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
        // eslint-disable-next-line no-constant-condition
        while (true) {
            await this.updateToLastBlock()

            await sleep(10000)
        }
    }

    public async updateToLastBlock(): Promise<void> {
        try {
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
        } catch (error: any) {
            this.logger.error(`Error appeared during syncing: ${error}`)
        }
    }

    public async sync(): Promise<void> {
        const lastCheckedBlock = await this.lastBlockService.getOrCreateLastBlock(this.currentBlockchain)

        const lastBlockchainBlock: number = Number(await this.web3.eth.getBlockNumber())
        let currentBlockHash = lastCheckedBlock.blockHash

        if (0 === currentBlockHash) {
            currentBlockHash = lastBlockchainBlock - 1
        }

        this.logger.info(`Updating from block ${currentBlockHash} to block ${lastBlockchainBlock}`)

        this.isUpdatingBlocks = true

        try {
            while (currentBlockHash < lastBlockchainBlock) {
                const blockToCheck = ++currentBlockHash
                const block = await this.web3.eth.getBlock(blockToCheck, false)

                if (!block.transactions) {
                    this.logger.warn(`No transactions in this block, Skipping`)
                    currentBlockHash++
                    continue
                }

                for (let i = 0; i < block.transactions.length; i++) {
                    const transaction = block.transactions[i]

                    if (!transaction) {
                        continue
                    }

                    const txHash = 'string' === typeof transaction
                        ? transaction
                        : transaction.hash

                    await this.checkTransaction(txHash)
                }

                currentBlockHash++
                await this.updateBlockHash(lastCheckedBlock, currentBlockHash)
            }
        } finally {
            this.logger.info(`Last block updated to: ${currentBlockHash}`)
            this.isUpdatingBlocks = false
        }
    }

    private async updateBlockHash(lastCheckedBlock: LastBlock, newHash: number): Promise<void> {
        lastCheckedBlock.blockHash = newHash
        await this.lastBlockService.updateLastBlock(lastCheckedBlock)
    }

    private async checkTransaction(txHash: string): Promise<void> {
        this.logger.info(`checking tx ${txHash}`)

        try {
            const transaction: TransactionReceipt = await this.web3.eth.getTransactionReceipt(txHash)
            const logs = transaction.logs
            const log = logs.find(i => i.transactionHash === txHash)

            if (!log) {
                return
            }

            const abiJson = [
                { 'constant':true,
                    'inputs':[],
                    'name':'symbol',
                    'outputs':
                [ { 'name':'', 'type':'string' } ]
                    , 'payable':false, 'stateMutability':'view', 'type':'function' },
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
            ]

            const tokenAddress = log.address

            if (!tokenAddress) {
                return
            }

            const contract = new this.web3.eth.Contract(abiJson, tokenAddress)
            const name = await contract.methods.name().call()
            const symbol = await contract.methods.symbol().call()
            const tokenName = `${name} (${symbol})`

            if (!isForbiddenTokenName(tokenName)) {
                await this.queuedTokenAddressService.push(tokenAddress, this.currentBlockchain)
            }
        } catch (error) {
            this.logger.warn(`Couldn't get contract info, E: ${error}`)
        }
    }
}
