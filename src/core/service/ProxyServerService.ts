import { singleton } from 'tsyringe'
import { ProxyServerRepository } from '../repository'
import { ProxyServer } from '../entity'

@singleton()
export class ProxyService {
    public constructor(
        private proxyServerRepository: ProxyServerRepository,
    ) { }

    public async getProxyById(proxyID: number): Promise<ProxyServer|undefined> {
        return this.proxyServerRepository.findByID(proxyID)
    }

    public async setProxyDisabled(proxyServer: ProxyServer): Promise<void> {
        proxyServer.isDisabled = true

        await this.proxyServerRepository.save(proxyServer)
    }

    public async getFirstNotUsedProxy(): Promise<ProxyServer|undefined> {
        return this.proxyServerRepository.getFirstNotAssignedProxy()
    }
}
