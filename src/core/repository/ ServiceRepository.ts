import { singleton } from 'tsyringe'
import { Repository, EntityRepository } from 'typeorm'
import { Service } from '../entity'

@singleton()
@EntityRepository(Service)
export class ServiceRepository extends Repository<Service> {
    public async findByName(name: string): Promise<Service | undefined> {
        return this.findOne({ where: { name } })
    }
}
