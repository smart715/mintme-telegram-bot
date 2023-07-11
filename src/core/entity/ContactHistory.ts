import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ContactHistoryStatusType, ContactMethod } from '../types';
import { Blockchain } from '../../utils';

@Entity()
@Index('IDX_ADDRESS_BLOCKCHAIN', ['address', 'blockchain'])
export class ContactHistory {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public address: string

    @Column()
    public blockchain: Blockchain

    @Column()
    public contactMethod: ContactMethod

    @Column()
    public isSuccess: boolean

    @Column()
    public channel: string

    @Column()
    public messageId: number
    
    @Column()
    public status: ContactHistoryStatusType

    @Column()
    public createdAt: Date

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
