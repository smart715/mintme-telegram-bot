import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class TelegramAutoDmResponse {
    @PrimaryGeneratedColumn()
    public id: number

    @Column('text')
    public message: string

    @Column()
    public order: number
}
