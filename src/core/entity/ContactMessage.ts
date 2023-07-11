import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ContactMessage {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public title: string

    @Column()
    public content: string

    @Column()
    public allowedBlockchains: string

    @Column()
    public isTgOnly: boolean
}
