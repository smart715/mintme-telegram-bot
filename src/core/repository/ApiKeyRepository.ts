import { singleton } from 'tsyringe'
import { Repository, EntityRepository } from 'typeorm'
import { ApiKey } from '../entity'

@singleton()
@EntityRepository(ApiKey)
export class ApiKeyRepository extends Repository<ApiKey> {
    public async findAvailableKey(serviceId: number): Promise<ApiKey | undefined> {
        return this.createQueryBuilder('apiKey')
            .leftJoinAndSelect('apiKey.service', 'service')
            .where('service.id = :serviceId', { serviceId })
            .orderBy('apiKey.updatedAt', 'ASC')
            .getOne()
    }

    public async updateNextAttemptDate(apiKeyId: number, nextAttemptDate: Date): Promise<void> {
        await this.update(apiKeyId, { nextAttemptDate })
    }

    public async updateApiKeyDisabledStatus(apiKeyId: number, disabled: boolean): Promise<void> {
        await this.update(apiKeyId, { disabled })
    }

    public async findAllAvailableKeys(serviceId: number): Promise<ApiKey[]> {
        return this.createQueryBuilder('apiKey')
            .leftJoinAndSelect('apiKey.service', 'service')
            .where('service.id = :serviceId', { serviceId })
            .orderBy('apiKey.updatedAt', 'ASC')
            .getMany()
    }
}
