import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm'
import { TelegramAccount } from '.'

@Entity()
export class TelegramResponse {
    @PrimaryGeneratedColumn()
    public id: number

    @ManyToOne(() => TelegramAccount)
    @JoinColumn()
    public telegamAccount!: TelegramAccount

    @Column()
    public chatLink!: string

    @Column('longtext')
    public chatMessages!: string

    @Column()
    public isChecked!: boolean

    @Column()
    public type!: string
}
