import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { BlacklistType } from '../types'

@Entity()
export class Blacklist {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ unique: true })
    public content!: string

    @Column()
    public type: BlacklistType
}
