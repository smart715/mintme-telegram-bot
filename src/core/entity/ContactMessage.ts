import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class ContactMessage {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public attempt: number

    @Column({ length: 512 })
    public title: string

    @Column('text')
    public content: string

    @Column({ default: false })
    public isTgOnly: boolean

    @Column({ type: 'int', nullable: true })
    public accountID!: number | null
}
