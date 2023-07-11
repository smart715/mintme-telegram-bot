import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { Token } from '../entity'
import moment from 'moment'
import config from 'config'
import { TokenContactStatusType } from '../types'
import { Blockchain } from '../../utils'

@singleton()
@EntityRepository(Token)
export class TokenRepository extends Repository<Token> {
    public async getLastNotContactedTokens(blockchain: Blockchain): Promise<Token[]> {
        const delayInSeconds = parseInt(config.get('contact_frequency_in_seconds'))

        return this.createQueryBuilder()
            .select([
                'id',
                'address',
                'blockchain',
                'name',
                'emails',
                'links',
                'last_contact_method',
                'email_attempts',
                'twitter_attempts',
                'telegram_attempts',
            ])
            .where('contact_status = :status', {status: TokenContactStatusType.NOT_CONTACTED})
            .andWhere('avoid_contacting = 0')
            .andWhere('blockchain = :blockchain', {blockchain})
            .andWhere(
                'last_contact_attempt is null or last_contact_attempt < :dateBefore',
                {dateBefore: moment().utc().subtract(delayInSeconds, 'second').format()}
            )
            .getRawMany()
    }

    public async findByAddressAndBlockchain(address: string, blockchain: Blockchain): Promise<Token | undefined> {
        return this.findOne({where: {address, blockchain}})
    }
}
