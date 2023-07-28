import { EntityRepository, Repository } from 'typeorm'
import { DuplicatesFound } from '../entity'
import { singleton } from 'tsyringe'

@singleton()
@EntityRepository(DuplicatesFound)
export class DuplicatesFoundRepository extends Repository<DuplicatesFound> { }
