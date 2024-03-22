import { singleton } from 'tsyringe'
import { Brackets, EntityRepository, Repository } from 'typeorm'
import { TelegramAccount } from '../entity'
import moment from 'moment'

@singleton()
@EntityRepository(TelegramAccount)
export class TelegramAccountsRepository extends Repository<TelegramAccount> {
    public async getAllAccounts(): Promise<TelegramAccount[]> {
        return this.createQueryBuilder('t')
            .leftJoinAndSelect('t.proxy', 'proxy')
            .where('t.is_disabled = 0')
            .andWhere(new Brackets((qb) => qb
                .where('t.last_responses_fetch_date < :dateBefore2Days',
                    { dateBefore2Days: moment.utc().subtract(2, 'days').format() })
                .orWhere('t.limit_hit_reset_date < :currentDate',
                    { currentDate: moment.utc().format() })
                .orWhere('t.last_responses_fetch_date IS NULL')
                .orWhere('t.limit_hit_reset_date IS NULL')
            ))
            .getMany()
    }

    public async getAllAccountsForResponseWorker(): Promise<TelegramAccount[]> {
        return this.createQueryBuilder('t')
            .leftJoinAndSelect('t.proxy', 'proxy')
            .where('t.is_disabled = 0')
            .andWhere(new Brackets((qb) => qb
                .where('t.last_responses_fetch_date < :dateBefore2Days',
                    { dateBefore2Days: moment.utc().subtract(2, 'days').format() })
                .orWhere('t.last_responses_fetch_date IS NULL')
            ))
            .getMany()
    }

    public async findById(id: number): Promise<TelegramAccount | undefined> {
        return this.findOne({ where: { id } })
    }
}
