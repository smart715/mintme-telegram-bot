import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
export class DuplicatesFound {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ unique: true })
    public source: string

    @Column({ default: 0 })
    public duplicates: number
}
