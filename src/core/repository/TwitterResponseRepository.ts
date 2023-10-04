import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { TwitterResponse } from '../entity'

@singleton()
@EntityRepository(TwitterResponse)
export class TwitterResponseRepository extends Repository<TwitterResponse> {
    public async isExistingReponse(messageTitle: string, userName: string): Promise<boolean> {
        const find = await this.createQueryBuilder()
            .where('message_title = :messageTitle', { messageTitle })
            .andWhere('user_name = :userName', { userName })
            .getCount()

        return find > 0
    }
}
