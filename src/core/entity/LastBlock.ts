import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Blockchain } from '../../utils'

@Entity()
export class LastBlock {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public blockchain: Blockchain

    @Column()
    public blockHash: number

    public constructor(blockchain: Blockchain) {
        this.blockchain = blockchain
        this.blockHash = 0
    }
}
