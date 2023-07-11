import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { ChannelStatus } from '../entity'

@singleton()
@EntityRepository(ChannelStatus)
export class ChannelStatusRepository extends Repository<ChannelStatus> { }
