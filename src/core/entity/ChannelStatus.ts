import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm'
import { ChannelStatusType } from '../types'
import { Blockchain } from '../../utils'

@Entity()
@Index('UQ_ADDRESS_BLOCKCHAIN_CHANNEL', ['address', 'blockchain', 'channel'], { unique: true })
export class ChannelStatus {
    @PrimaryGeneratedColumn()
    public id: string

    @Column({ length: 80 })
    public address: string

    @Column({ length: 32 })
    public blockchain: Blockchain

    @Column({ length: 512 })
    public channel: string

    @Column('tinyint', { width: 4, default: 0})
    public attemptsAmount: number

    @Column({ length: 32 })
    public status: ChannelStatusType

    @CreateDateColumn()
    public createdAt: Date

    @UpdateDateColumn()
    public lastAttempt: Date

    public constructor(address: string, blockchain: Blockchain, channel: string, status: ChannelStatusType) {
        this.address = address
        this.blockchain = blockchain
        this.channel = channel
        this.status = status
    }

    @BeforeInsert()
    @BeforeUpdate()
    protected beforeUpdate() {
        this.lastAttempt = new Date()
    }
}
