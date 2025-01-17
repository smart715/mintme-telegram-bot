import { singleton } from 'tsyringe'
import { ProxyServerRepository } from '../repository'
import { ProxyServer } from '../entity'
import config from 'config'
import { AccountType } from '../types'

@singleton()
export class ProxyService {
    private maxTelegramAccountsPerProxy: number = config.get('telegram_accounts_per_proxy')

    public constructor(
        private proxyServerRepository: ProxyServerRepository,
    ) { }

    public async setProxyDisabled(proxyServer: ProxyServer): Promise<void> {
        proxyServer.isDisabled = true

        await this.proxyServerRepository.save(proxyServer)
    }

    public async getFirstAvailableProxy(): Promise<ProxyServer|undefined> {
        return this.proxyServerRepository.getFirstAvailableProxy(this.maxTelegramAccountsPerProxy)
    }

    public async getRandomProxy(accountType: AccountType): Promise<ProxyServer | undefined> {
        return this.proxyServerRepository.getRandomProxy(accountType)
    }
}
