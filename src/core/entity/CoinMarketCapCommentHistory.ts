import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
@Index('IDX_ADDRESS_BLOCKCHAIN', [ 'address', 'blockchain' ])
export class ContactHistory {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ length: 80 })
    public coinId: string

    @Column({ nullable: true })
    public commentId: number

    @CreateDateColumn()
    public createdAt: Date

    @Column()
    public accountId: number
}
