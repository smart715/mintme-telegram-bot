import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Blockchain } from '../../utils'

@Entity()
export class NewestCheckedToken {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public workerName: string

    @Column()
    public tokenId: string

    @Column({
        type: 'varchar',
        length: 32,
        nullable: true,
    })
    public blockchain: Blockchain|null
}
