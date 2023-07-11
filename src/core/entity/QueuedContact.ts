import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { Blockchain } from '../../utils'

@Entity()
@Index('UQ_ADDRESS_BLOCKCHAIN', ['address', 'blockchain'], {unique: true})
export class QueuedContact {
    @PrimaryGeneratedColumn()
    public id: string

    @Column()
    public address: string

    @Column()
    public blockchain: Blockchain

    @Column()
    public channel: string

    @Column()
    public isPlanned: boolean

    @Column()
    public isProcessing: boolean

    @Column()
    public createdAt: Date
}
