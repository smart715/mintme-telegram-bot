import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Blockchain } from '../../utils'

@Entity()
@Unique('UQ_LAST_CHECKED_NAME_SOURCE_BLOCKCHAIN', [ 'source', 'blockchain' ])
export class LastCheckedTokenName {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public source: string

    @Column()
    public blockchain: Blockchain

    @Column()
    public tokenName: string
}
