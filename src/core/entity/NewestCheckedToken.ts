import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class NewestCheckedToken {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public workerName: string

    @Column()
    public tokenId: string
}
