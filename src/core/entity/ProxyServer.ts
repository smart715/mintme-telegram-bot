import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

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
}
