import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { QueuedContact } from '../entity'

@singleton()
@EntityRepository(QueuedContact)
export class QueuedContactRepository extends Repository<QueuedContact> { }
