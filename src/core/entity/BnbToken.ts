import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("bnbTokens")
export class BnbToken {
    @PrimaryColumn()
    public tokenAddress!: string

    @Column({nullable: true})
    public Name: string

    @Column()
    public website!: string

    @Column()
    public email!: string

    @Column()
    public links!: string

    @Column()
    public DateAdded!: Date

    @Column()
    public dup!: boolean

    @Column()
    public Responded!: number

    @Column()
    public AvoidContacting!: number

    @Column({nullable: true})
    public lastContactAttempt: Date

    @Column({nullable: true})
    public lastContactMethod: string

    @Column()
    public emailAttempts!: number

    @Column()
    public twitterAttempts!: number

    @Column({nullable: true})
    public source: string

    @Column({nullable: true})
    public lastUpdate: Date
}