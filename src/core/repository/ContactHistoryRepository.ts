import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { ContactHistory } from '../entity'

@singleton()
@EntityRepository(ContactHistory)
export class ContactHistoryRepository extends Repository<ContactHistory> { }
