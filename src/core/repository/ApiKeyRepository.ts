import { singleton } from 'tsyringe'
import { Repository, EntityRepository } from 'typeorm'
import { ApiKey } from '../entity'

@singleton()
@EntityRepository(ApiKey)
export class ApiKeyRepository extends Repository<ApiKey> {
    public async findAllAvailableKeys(serviceId: number): Promise<ApiKey[]> {
        return this.createQueryBuilder('apiKey')
            .leftJoinAndSelect('apiKey.service', 'service')
            .where('service.id = :serviceId', { serviceId })
            .andWhere('apiKey.disabled = 0')
            .orderBy('apiKey.updatedAt', 'ASC')
            .getMany()
    }

    public async updateNextAttemptDate(apiKeyId: number, nextAttemptDate: Date): Promise<void> {
        await this.update(apiKeyId, { nextAttemptDate })
    }

    public async incrementFailureCount(apiKeyId: number): Promise<void> {
        await this.createQueryBuilder()
            .update(ApiKey)
            .set({ failureCount: () => 'failure_count + 1' })
            .where('id = :apiKeyId', { apiKeyId })
            .execute()
    }
}
