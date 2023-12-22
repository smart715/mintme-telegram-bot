import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { ApiKey } from './ApiKey'

@Entity({ name: 'service' })
export class Service {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ name: 'name', length: 255, unique: true })
    public name: string

    @OneToMany(() => ApiKey, apiKey => apiKey.service)
    public apiKeys: ApiKey[]

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    public createdAt: Date

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    public updatedAt: Date
}
