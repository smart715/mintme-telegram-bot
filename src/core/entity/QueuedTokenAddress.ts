import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm'
import { Blockchain } from '../../utils'

@Entity()
@Unique('UQ_QUEUED_TOKEN_ADDRESS_BLOCKCHAIN', [ 'tokenAddress', 'blockchain' ])
export class QueuedTokenAddress {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public tokenAddress: string

    @Column()
    public blockchain: Blockchain

    @Column({ default: false })
    public isChecked: boolean
}
