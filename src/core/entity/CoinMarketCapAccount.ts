import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ProxyServer } from './ProxyServer'

@Entity()
export class CoinMarketCapAccount {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public userName!: string

    @Column({ type: 'text', name: 'cookies_json' })
    public cookiesJSON!: string

    @Column({ type: 'text' })
    public localStorageJSON!: string

    @Column()
    public isDisabled!: boolean

    @ManyToOne(() => ProxyServer, (proxy) => proxy.cmcAccounts, { eager: true })
    @JoinColumn()
    public proxy: ProxyServer

    @Column({ nullable: true })
    public lastLogin!: Date

    @Column({ default: 0 })
    public continousFailed: number
}
