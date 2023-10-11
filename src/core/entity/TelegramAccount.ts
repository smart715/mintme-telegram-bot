import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { ProxyServer } from './ProxyServer'

@Entity()
export class TelegramAccount {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public phoneNumber!: string

    @Column()
    public userName!: string

    @Column('text')
    public localStorageJson!: string

    @Column()
    public isDisabled!: boolean

    @Column({ nullable: true })
    public limitHitResetDate!: Date

    @Column({ nullable: true })
    public lastLogin!: Date

    @ManyToOne(() => ProxyServer, (proxy) => proxy.tgAccounts, { eager: true })
    @JoinColumn()
    public proxy: ProxyServer

    @Column({ nullable: true })
    public lastResponsesFetchDate!: Date
}
