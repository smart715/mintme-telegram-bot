import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm'
import { TwitterAccount } from '.'

@Entity()
export class TwitterResponse {
    @PrimaryGeneratedColumn()
    public id: number

    @ManyToOne(() => TwitterAccount)
    @JoinColumn()
    public twitterAccount!: TwitterAccount

    @Column()
    public userName!: string

    @Column('longtext')
    public messageTitle!: string

    @Column()
    public isChecked!: boolean
}
