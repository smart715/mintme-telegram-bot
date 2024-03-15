import { Column, PrimaryGeneratedColumn } from 'typeorm'

export abstract class AbstractAccount {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public userName!: string

    @Column()
    public isDisabled!: boolean
}
