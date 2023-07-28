import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { LastCheckedTokenName } from '../entity'

@singleton()
@EntityRepository(LastCheckedTokenName)
export class LastCheckedTokenNameRepository extends Repository<LastCheckedTokenName> { }
