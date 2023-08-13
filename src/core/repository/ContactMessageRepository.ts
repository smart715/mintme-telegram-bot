import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { ContactMessage } from '../entity'

@singleton()
@EntityRepository(ContactMessage)
export class ContactMessageRepository extends Repository<ContactMessage> {
    public async getAllMessages(isTg: boolean): Promise<ContactMessage[]> {
        const messages = await this.find({
            where:{
                isTgOnly: isTg,
            },
        })
        return messages
    }

    public async getAccountMessages(isTg: boolean, accID: number): Promise<ContactMessage[]> {
        const messages = await this.find({
            where: {
                accountID: accID,
                isTgOnly: isTg,
            },
        })
        return messages
    }
}
