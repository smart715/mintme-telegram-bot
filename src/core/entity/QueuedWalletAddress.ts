import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm'
import { Blockchain } from '../../utils'

@Entity()
@Unique('UQ_QUEUED_WALLET_ADDRESS_BLOCKCHAIN', [ 'walletAddress', 'blockchain' ])
export class QueuedWalletAddress {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public walletAddress: string

    @Column()
    public blockchain: Blockchain

    @Column({ default: false })
    public isChecked: boolean
}
