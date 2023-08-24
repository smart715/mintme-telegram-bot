import { singleton } from 'tsyringe'
import { EntityRepository, Repository } from 'typeorm'
import { ProxyServer } from '../entity'

@singleton()
@EntityRepository(ProxyServer)
export class ProxyServerRepository extends Repository<ProxyServer> {
    public async getAllAccounts(): Promise<ProxyServer[]> {
        return this.find()
    }

    public async findByID(proxyID: number): Promise<ProxyServer | undefined> {
        return this.findOne({ where: { id: proxyID } })
    }

    public async getFirstNotAssignedProxy(): Promise<ProxyServer | undefined> {
        return this.createQueryBuilder()
            .where('id NOT IN (SELECT proxy_id FROM telegram_account WHERE proxy_id > 0)')
            .getOne()
    }
}
