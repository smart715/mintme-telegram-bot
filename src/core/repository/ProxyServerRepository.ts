import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { ProxyServer } from '../entity'

@singleton()
@EntityRepository(ProxyServer)
export class ProxyServerRepository extends Repository<ProxyServer> {
    public async getFirstAvailableProxy(maxTelegramAccountsPerProxy: number): Promise<ProxyServer | undefined> {
        return this.createQueryBuilder()
            .where(`id NOT IN 
            (SELECT proxy_id FROM telegram_account 
            WHERE proxy_id IS NOT NULL 
            GROUP BY proxy_id HAVING COUNT(*) >= :maxAccountsPerProxy)`, { maxAccountsPerProxy: maxTelegramAccountsPerProxy })
            .getOne()
    }

    public async getRandomProxy(): Promise<ProxyServer | undefined> {
        return this.createQueryBuilder()
            .where('is_disabled = 0')
            .orderBy('RAND()')
            .getOne()
    }
}
