import { Column, Entity } from 'typeorm'
import { AbstractAccount } from './AbstractAccount'

@Entity()
export class TwitterAccount extends AbstractAccount {
    @Column({ type: 'text', name: 'cookies_json' })
    public cookiesJSON!: string

    @Column({ nullable: true })
    public lastResponsesFetchDate!: Date
}
