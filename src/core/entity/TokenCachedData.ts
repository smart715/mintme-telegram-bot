import { BeforeInsert, BeforeUpdate, Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity()
@Unique('UQ_TOKEN_ID_SOURCE', [ 'tokenId', 'source' ])
@Index('IDX_SOURCE', [ 'source' ])
export class TokenCachedData {
    @PrimaryGeneratedColumn()
    public readonly id!: number

    @Column({ name: 'token_id' })
    public tokenId: string

    @Column()
    public source: string

    @Column({ nullable: true, type: 'text' })
    public data: string = ''

    @Column({ name: 'updated_at' })
    public updatedAt: number

    public constructor(tokenId: string, source: string, data: string) {
        this.tokenId = tokenId
        this.source = source
        this.data = data
    }

    @BeforeInsert()
    @BeforeUpdate()
    protected beforeUpdate(): void {
        this.updatedAt = Math.floor(Date.now() / 1000)
    }
}
