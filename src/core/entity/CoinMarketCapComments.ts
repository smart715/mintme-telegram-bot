import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class ContactMessage {
    @PrimaryGeneratedColumn()
    public id: number

    @Column('text')
    public content: string
}
