import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { CheckedToken } from '../entity'

@singleton()
@EntityRepository(CheckedToken)
export class CheckedTokenRepository extends Repository<CheckedToken> { }
