import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ProxyServer } from './ProxyServer'
import { AbstractAccount } from './AbstractAccount'

@Entity()
export class TelegramAccount extends AbstractAccount {
    @Column()
    public phoneNumber!: string

    @Column('text')
    public localStorageJson!: string

    @Column({ nullable: true })
    public limitHitResetDate!: Date

    @Column({ nullable: true })
    public lastLogin!: Date

    @ManyToOne(() => ProxyServer, (proxy) => proxy.tgAccounts, { eager: true })
    @JoinColumn()
    public proxy: ProxyServer

    @Column({ nullable: true })
    public lastResponsesFetchDate!: Date

    @Column({ nullable: true })
    public lastGroupsLeavingDate!: Date
}
