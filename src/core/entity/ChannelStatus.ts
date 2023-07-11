import { BeforeInsert, BeforeUpdate, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { ChannelStatusType } from '../types'
import { Blockchain } from '../../utils'

@Entity()
@Index('UQ_ADDRESS_BLOCKCHAIN_CHANNEL', ['address', 'blockchain', 'channel'], { unique: true })
export class ChannelStatus {
    @PrimaryGeneratedColumn()
    public id: string

    @Column()
    public address: string

    @Column()
    public blockchain: Blockchain

    @Column()
    public channel: string

    @Column({default: 0})
    public attemptsAmount: number = 0

    @Column()
    public status: ChannelStatusType

    @Column()
    public createdAt: Date

    @Column()
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
