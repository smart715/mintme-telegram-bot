import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class TwitterAccount {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public userName!: string

    @Column({ nullable: true })
    public assignedServerIP!: string

    @Column({ type: 'text', name: 'cookies_json' })
    public cookiesJSON!: string

    @Column()
    public isDisabled!: boolean
}
