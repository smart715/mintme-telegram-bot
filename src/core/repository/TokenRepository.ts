import moment from 'moment'
import config from 'config'
import { singleton } from 'tsyringe'
import { Brackets, EntityRepository, Repository } from 'typeorm'
import { Token } from '../entity'
import { Blockchain } from '../../utils'
import { TokenContactStatusType, TokensCountGroupedBySourceAndBlockchain } from '../types'

@singleton()
@EntityRepository(Token)
export class TokenRepository extends Repository<Token> {
    public async findByAddressAndBlockchain(address: string, blockchain: Blockchain): Promise<Token | undefined> {
        return this.findOne({ where: { address, blockchain } })
    }

    public async findByNameAndBlockchain(name: string, blockchain: Blockchain): Promise<Token | undefined> {
        return this.findOne({ where: { name, blockchain } })
    }

    public async getLastNotContactedTokens(blockchain: Blockchain,
        maxEmailAttempts: number,
        maxTwitterAttempts: number,
        maxTelegramAttempts: number): Promise<Token[]> {
        const delayInSeconds = parseInt(config.get('contact_frequency_in_seconds'))

        return this.createQueryBuilder()
            .where('contact_status = :status', { status: TokenContactStatusType.NOT_CONTACTED })
            .andWhere('avoid_contacting = 0')
            .andWhere('blockchain = :blockchain', { blockchain })
            .andWhere(`((email_attempts < ${maxEmailAttempts} AND emails LIKE '%@%') OR (twitter_attempts < ${maxTwitterAttempts} AND links LIKE '%twitter.com%') OR (telegram_attempts < ${maxTelegramAttempts} AND links LIKE '%t.me/%'))`)
            .andWhere(
                '(last_contact_attempt is null or last_contact_attempt < :dateBefore)',
                { dateBefore: moment().utc().subtract(delayInSeconds, 'second').format() }
            )
            .getMany()
    }

    public async getNextWithoutTxDate(): Promise<Token | undefined> {
        return this.createQueryBuilder()
            .where('last_tx_date is null')
            .andWhere(new Brackets(queryBuilder => {
                queryBuilder
                    .where(`emails like '%@%'`)
                    .orWhere(`links like '%twitter.com%'`)
                    .orWhere(`links like '%t.me/%'`)
            }))
            .orderBy('created_at', 'DESC')
            .getOne()
    }

    public async findGroupedBySourceAndBlockchain(from: Date): Promise<TokensCountGroupedBySourceAndBlockchain[]> {
        const result = await this.createQueryBuilder()
            .select([ 'COUNT(*) as tokens', 'source', 'blockchain' ])
            .andWhere('created_at > :from', { from: from })
            .groupBy('source, blockchain')
            .orderBy('tokens', 'DESC')
            .getRawMany()

        return result as TokensCountGroupedBySourceAndBlockchain[]
    }
}
