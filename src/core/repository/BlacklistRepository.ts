import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { Blacklist } from '../entity'
import { BlacklistType } from '../types'

@singleton()
@EntityRepository(Blacklist)
export class BlacklistRepository extends Repository<Blacklist> {
    public async isChatInBlacklist(chatLink: string): Promise<boolean> {
        const find = await this.createQueryBuilder()
            .where('type = :type', { type: BlacklistType.CHAT_LINK })
            .andWhere('content = :chatLink', { chatLink })
            .getCount()

        return find > 0
    }

    public async isMessagesContainsBlacklistWord(messages: string): Promise<boolean> {
        const find = await this.createQueryBuilder()
            .where('type = :type', { type: BlacklistType.MESSAGE_CONTENT })
            .andWhere('INSTR(:messages, content) > 0', { messages })
            .getCount()

        return find > 0
    }

    public async isUsernameInBlacklist(username: string): Promise<boolean> {
        const find = await this.createQueryBuilder()
            .where('type = :type', { type: BlacklistType.USERNAME })
            .andWhere('content = :username', { username })
            .getCount()

        return find > 0
    }
}
