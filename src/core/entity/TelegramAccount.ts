import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class TelegramAccount {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public phoneNumber!: string

    @Column()
    public userName!: string

    @Column({ nullable: true })
    public assignedServerIP!: string

    @Column('text')
    public localStorageJson!: string

    @Column()
    public isDisabled!: boolean

    @Column({ nullable: true })
    public limitHitResetDate!: Date
}
