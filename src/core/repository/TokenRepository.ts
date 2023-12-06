import moment from 'moment'
import config from 'config'
import { singleton } from 'tsyringe'
import { Brackets, EntityRepository, Repository } from 'typeorm'
import { Token } from '../entity'
import { Blockchain, removeHttpsProtocol } from '../../utils'
import { TokenContactStatusType, TokensCountGroupedBySourceAndBlockchain } from '../types'

@singleton()
@EntityRepository(Token)
export class TokenRepository extends Repository<Token> {
    public async findByAddressAndBlockchain(address: string, blockchain: Blockchain): Promise<Token | undefined> {
        return this.findOne({ where: { address, blockchain } })
    }

    public async findByAddress(address: string): Promise<Token | undefined> {
        return this.createQueryBuilder()
            .where('LOWER(address) LIKE :address', { address: `%${address.trim().toLowerCase()}%` })
            .getOne()
    }

    public async findByNameAndBlockchain(name: string, blockchain: Blockchain): Promise<Token | undefined> {
        return this.findOne({ where: { name, blockchain } })
    }

    public async getLastNotContactedTokens(blockchain: Blockchain|undefined,
        maxEmailAttempts: number,
        maxTwitterAttempts: number,
        maxTelegramAttempts: number): Promise<Token[]> {
        const delayInSeconds = parseInt(config.get('contact_frequency_different_channel_in_seconds'))

        const queryBuilder = this.createQueryBuilder()
            .where(new Brackets(queryBuilder => {
                queryBuilder
                    .where('contact_status = :notContactedStatus', { notContactedStatus: TokenContactStatusType.NOT_CONTACTED })
                    .orWhere('contact_status = :contactedStatus', { contactedStatus: TokenContactStatusType.CONTACTED })
            }))
            .andWhere('avoid_contacting = 0')
            .andWhere(`((email_attempts < ${maxEmailAttempts} AND emails LIKE '%@%') OR (twitter_attempts < ${maxTwitterAttempts} AND (links LIKE '%twitter.com%' OR links LIKE '%x.com%' )) OR (telegram_attempts < ${maxTelegramAttempts} AND links LIKE '%t.me/%'))`)
            .andWhere(
                '(last_contact_attempt is null or last_contact_attempt < :dateBefore)',
                { dateBefore: moment().utc().subtract(delayInSeconds, 'second').format() }
            )
            .orderBy(`created_at`, 'DESC')

        if (blockchain) {
            queryBuilder.andWhere('blockchain = :blockchain', { blockchain })
        }

        return queryBuilder.getMany()
    }

    public async getNextWithoutTxDate(): Promise<Token | undefined> {
        return this.createQueryBuilder()
            .where('last_tx_date is null')
            .andWhere(new Brackets(queryBuilder => {
                queryBuilder
                    .where(`emails like '%@%'`)
                    .orWhere(`links like '%twitter.com%'`)
                    .orWhere(`links like '%x.com%'`)
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

    public async isChannelOfRespondedToken(
        queuedChannel: string,
        isEmail: boolean
    ): Promise<boolean> {
        const query = this.createQueryBuilder()

        if (isEmail) {
            query.where('INSTR(emails, :queuedChannel) > 0', { queuedChannel })
        } else {
            query.where('INSTR(links, :queuedChannel) > 0', { queuedChannel: removeHttpsProtocol(queuedChannel) })
        }

        query.andWhere('contact_status = :status', { status: TokenContactStatusType.RESPONDED })

        const tokensCount = await query.getCount()

        return tokensCount > 0
    }
}
