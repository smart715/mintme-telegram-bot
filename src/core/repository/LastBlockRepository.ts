import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { LastBlock } from '../entity'

@singleton()
@EntityRepository(LastBlock)
export class LastBlockRepository extends Repository<LastBlock> { }
