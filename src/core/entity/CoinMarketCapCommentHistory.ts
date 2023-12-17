import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class CoinMarketCapCommentHistory {
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
