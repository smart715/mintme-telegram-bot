import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { NewestCheckedToken } from '../entity'

@singleton()
@EntityRepository(NewestCheckedToken)
export class NewestCheckedTokenRepository extends Repository<NewestCheckedToken> { }
