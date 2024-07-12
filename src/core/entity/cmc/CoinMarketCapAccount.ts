import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { ProxyServer } from '../ProxyServer'
import { AbstractAccount } from '../AbstractAccount'

@Entity()
export class CoinMarketCapAccount extends AbstractAccount {
    @Column({ type: 'text', name: 'cookies_json' })
    public cookiesJSON!: string

    @Column({ type: 'text' })
    public localStorageJSON!: string

    @ManyToOne(() => ProxyServer, (proxy) => proxy.cmcAccounts, { eager: true })
    @JoinColumn()
    public proxy: ProxyServer|null

    @Column({ nullable: true })
    public lastLogin!: Date

    @Column({ default: 0 })
    public continousFailed: number
}
