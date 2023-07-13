import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { Blockchain } from '../../utils'

@Entity()
@Index('UQ_ADDRESS_BLOCKCHAIN', ['address', 'blockchain'], {unique: true})
export class QueuedContact {
    @PrimaryGeneratedColumn()
    public id: string

    @Column({ length: 80 })
    public address: string

    @Column({ length: 32 })
    public blockchain: Blockchain

    @Column( { length: 512 })
    public channel: string

    @Column({ default: false })
    public isPlanned: boolean

    @Column({ default: false })
    public isProcessing: boolean

    @CreateDateColumn()
    public createdAt: Date
}
