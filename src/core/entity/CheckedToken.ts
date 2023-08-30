import { BeforeInsert, BeforeUpdate, Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity()
@Unique('UQ_TOKEN_ID_SOURCE', [ 'tokenId', 'source' ])
@Index('IDX_SOURCE', [ 'source' ])
export class CheckedToken {
    @PrimaryGeneratedColumn()
    public readonly id!: number

    @Column({ name: 'token_id' })
    public tokenId: string

    @Column()
    public source: string

    @Column({ name: 'updated_at' })
    public updatedAt: number

    public constructor(tokenId: string, source: string) {
        this.tokenId = tokenId
        this.source = source
    }

    @BeforeInsert()
    @BeforeUpdate()
    protected beforeUpdate(): void {
        this.updatedAt = Math.floor(Date.now() / 1000)
    }
}
