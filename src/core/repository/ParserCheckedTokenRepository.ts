import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { ParserCheckedToken } from '../entity'

@singleton()
@EntityRepository(ParserCheckedToken)
export class ParserCheckedTokenRepository extends Repository<ParserCheckedToken> { }
