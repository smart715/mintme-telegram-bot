import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne } from 'typeorm'
import { ProxyServer } from './ProxyServer'

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

    @OneToOne(() => ProxyServer)
    @JoinColumn()
    public proxy: ProxyServer
}
