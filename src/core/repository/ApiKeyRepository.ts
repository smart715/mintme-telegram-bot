import { singleton } from 'tsyringe'
import { Repository, EntityRepository } from 'typeorm'
import { ApiKey } from '../entity'

@singleton()
@EntityRepository(ApiKey)
export class ApiKeyRepository extends Repository<ApiKey> {
    public async findAvailableKey(serviceId: number): Promise<ApiKey | undefined> {
        return this.findOne({
            where: {
                serviceId,
                nextAttemptDate: null,
            },
            order: { updatedAt: 'ASC' },
        })
    }

    public async updateNextAttemptDate(apiKeyId: number, nextAttemptDate: Date): Promise<void> {
        await this.update(apiKeyId, { nextAttemptDate })
    }
}
