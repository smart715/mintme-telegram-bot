import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'
import { ContactMethod, TokenContactStatusType } from '../types'
import { Blockchain } from '../../utils'

@Entity()
@Index('UQ_ADDRESS_BLOCKCHAIN', [ 'address', 'blockchain' ], { unique: true })
export class Token {
    @PrimaryGeneratedColumn()
    public id: string

    @Column({ length: 80 })
    public address: string

    @Column({ length: 32 })
    public blockchain: Blockchain

    @Column({ nullable: true })
    public name: string

    @Column('simple-array', { nullable: true })
    public emails: string[]

    @Column('simple-array', { nullable: true })
    public websites: string[]

    @Column('simple-array', { nullable: true })
    public links: string[]

    @Column({ default: false })
    public avoidContacting: boolean

    @Column({ nullable: true })
    public lastContactAttempt: Date

    @Column({ length: 32, nullable: true })
    public lastContactMethod: ContactMethod

    @Column({ width: 4, default: 0 })
    public emailAttempts: number

    @Column({ width: 4, default: 0 })
    public twitterAttempts: number

    @Column({ width: 4, default: 0 })
    public telegramAttempts: number

    @Column({ width: 4, default: 0 })
    public duplicatedTimes: number

    @Column({ length: 64, nullable: true })
    public source: string

    @Column({ default: false })
    public isAddedToSheet: boolean

    @Column({ length: 32, default: TokenContactStatusType.NOT_CONTACTED })
    public contactStatus: TokenContactStatusType

    @CreateDateColumn()
    public createdAt: Date

    @UpdateDateColumn()
    public updatedAt: Date

    @Column({ nullable: true })
    public lastTxDate: Date
}
