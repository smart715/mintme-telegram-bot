import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ApiService } from './ApiService'

@Entity()
export class ApiKey {
    @PrimaryGeneratedColumn()
    public id: number

    @ManyToOne(() => ApiService, service => service.apiKeys)
    @JoinColumn({ name: 'service_id', referencedColumnName: 'id' })
    public service: ApiService

    @Column({ name: 'api_key', length: 255 })
    public apiKey: string

    @Column({ name: 'next_attempt_date', type: 'datetime', nullable: true })
    public nextAttemptDate: Date

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    public createdAt: Date

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    public updatedAt: Date
}
