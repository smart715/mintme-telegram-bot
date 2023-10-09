import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { TelegramResponse } from '../entity'

@singleton()
@EntityRepository(TelegramResponse)
export class TelegramResponseRepository extends Repository<TelegramResponse> {
    public async isExistingReponse(chatLink: string, chatMessages: string): Promise<boolean> {
        const find = await this.createQueryBuilder()
            .where('chat_link = :chatLink', { chatLink })
            .andWhere('chat_messages = :chatMessages', { chatMessages })
            .getCount()

        return find > 0
    }
}
