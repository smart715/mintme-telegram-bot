import { BeforeUpdate, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ContactMethod, TokenContactStatusType } from '../types';
import { Blockchain } from '../../utils';

@Entity()
@Index('UQ_ADDRESS_BLOCKCHAIN', ['address', 'blockchain'], {unique: true})
export class Token {
    @PrimaryGeneratedColumn()
    public id: string

    @Column()
    public address: string

    @Column()
    public blockchain: Blockchain

    @Column()
    public name: string

    @Column()
    public emails: string

    @Column()
    public websites: string

    @Column()
    public links: string

    @Column()
    public avoidContacting: boolean

    @Column()
    public lastContactAttempt: Date

    @Column()
    public lastContactMethod: ContactMethod

    @Column({default: 0})
    public emailAttempts: number = 0

    @Column({default: 0})
    public twitterAttempts: number = 0

    @Column({default: 0})
    public telegramAttempts: number = 0
    
    @Column()
    public source: string

    @Column()
    public contactStatus: TokenContactStatusType

    @Column()
    public createdAt: Date

    @Column()
    public updatedAt: Date

    @Column()
    public lastTxDate: Date

    @BeforeUpdate()
    protected setUpdatedAt() {
        this.updatedAt = new Date()
    }
}
