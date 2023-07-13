import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ContactMessage {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ length: 512 })
    public title: string

    @Column('text')
    public content: string

    @Column({ nullable: true })
    public allowedBlockchains: string

    @Column({ default: false })
    public isTgOnly: boolean
}
