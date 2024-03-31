import { singleton } from 'tsyringe'
import { Repository, EntityRepository } from 'typeorm'
import { ApiService } from '../entity'

@singleton()
@EntityRepository(ApiService)
export class ApiServiceRepository extends Repository<ApiService> {
    public async findByName(name: string): Promise<ApiService | undefined> {
        return this.findOne({ where: { name } })
    }
}
