import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class CoinMarketCapComment {
    @PrimaryGeneratedColumn()
    public id: number

    @Column('text')
    public content: string
}
