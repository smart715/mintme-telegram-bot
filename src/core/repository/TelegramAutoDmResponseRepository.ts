import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { TelegramAutoDmResponse } from '../entity'

@singleton()
@EntityRepository(TelegramAutoDmResponse)
export class TelegramAutoDmResponseRepository extends Repository<TelegramAutoDmResponse> {
    public async getMessageToSend(order: number): Promise<TelegramAutoDmResponse | undefined> {
        const qryBuilder = this.createQueryBuilder()
            .where('order = :order', { order })

        return qryBuilder.getOne()
    }
}
