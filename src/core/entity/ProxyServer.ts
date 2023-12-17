import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { TelegramAccount } from './TelegramAccount'
import { CoinMarketCapAccount } from './CoinMarketCapAccount'

@Entity()
export class ProxyServer {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public proxy!: string

    @Column()
    public authInfo!: string

    @Column()
    public isDisabled!: boolean

    @OneToMany(() => TelegramAccount, (tgAccount) => tgAccount.proxy)
    public tgAccounts: TelegramAccount[]

    @OneToMany(() => CoinMarketCapAccount, (cmcAccount) => cmcAccount.proxy)
    public cmcAccounts: CoinMarketCapAccount[]
}
