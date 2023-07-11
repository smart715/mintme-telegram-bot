import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { ContactMessage } from '../entity'

@singleton()
@EntityRepository(ContactMessage)
export class ContactMessageRepository extends Repository<ContactMessage> { }
