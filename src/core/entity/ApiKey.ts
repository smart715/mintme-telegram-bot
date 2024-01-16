import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Service } from './Service'

@Entity({ name: 'api_key' })
export class ApiKey {
    @PrimaryGeneratedColumn()
    public id: number

    @ManyToOne(() => Service, service => service.apiKeys)
    @JoinColumn({ name: 'serviceId', referencedColumnName: 'id' })
    public service: Service

    @Column({ name: 'api_key', length: 255 })
    public apiKey: string

    @Column({ name: 'next_attempt_date', type: 'datetime', nullable: true })
    public nextAttemptDate: Date

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    public createdAt: Date

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    public updatedAt: Date
}
