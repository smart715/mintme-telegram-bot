import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { ContactHistoryStatusType, ContactMethod } from '../types'
import { Blockchain } from '../../utils'

@Entity()
@Index('IDX_ADDRESS_BLOCKCHAIN', [ 'address', 'blockchain' ])
export class ContactHistory {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ length: 80 })
    public address: string

    @Column({ length: 32 })
    public blockchain: Blockchain

    @Column({ length: 64 })
    public contactMethod: ContactMethod

    @Column({ default: false })
    public isSuccess: boolean

    @Column({ length: 512, nullable: true })
    public channel: string

    @Column({ nullable: true })
    public messageId: number

    @Column({ length: 32, nullable: true })
    public status: ContactHistoryStatusType

    @CreateDateColumn()
    public createdAt: Date

    @Column({ nullable: true })
    public tgAccountId: number

    @Column({ nullable: true })
    public twitterAccountId: number

    public constructor(
        address: string,
        blockchain: Blockchain,
        contactMethod: ContactMethod,
        isSuccess: boolean,
        messageId: number,
        channel: string,
        status: ContactHistoryStatusType,
    ) {
        this.address = address
        this.blockchain = blockchain
        this.contactMethod = contactMethod
        this.isSuccess = isSuccess
        this.messageId = messageId
        this.channel = channel
        this.status = status
    }
}
