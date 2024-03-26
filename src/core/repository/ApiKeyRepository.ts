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

    public async updateNextAttemptDate(apiKeyId: number, failureCount: number): Promise<void> {
        const apiKey = await this.findOne(apiKeyId)
        if (!apiKey) {
            throw new Error(`API key with ID ${apiKeyId} not found.`)
        }

        const nextAttemptDays: number[] = [
            1,
            3,
            7,
            14,
            21,
            28,
        ]
        const maxIndex = nextAttemptDays.length - 1
        const index = Math.min(failureCount, maxIndex)
        const daysToAdd = nextAttemptDays[index]

        const nextAttemptDate = new Date()
        nextAttemptDate.setDate(nextAttemptDate.getDate() + daysToAdd)

        await this.update(apiKeyId, { nextAttemptDate, failureCount })
    }

    public async updateApiKeyDisabledStatus(apiKeyId: number, disabled: boolean): Promise<void> {
        await this.update(apiKeyId, { disabled })
    }

    public async incrementFailureCount(apiKeyId: number): Promise<void> {
        await this.createQueryBuilder()
            .update(ApiKey)
            .set({ failureCount: () => 'failure_count + 1' })
            .where('id = :apiKeyId', { apiKeyId })
            .execute()
    }
}
