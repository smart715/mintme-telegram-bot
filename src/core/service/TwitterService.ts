import { singleton } from 'tsyringe'
import { TwitterAccount } from '../entity'
import { TwitterAccountRepository } from '../repository'

@singleton()
export class TwitterService {
    public constructor(
        private readonly twitterAccountRepository: TwitterAccountRepository
    ) { }

    public async getAllAccounts(): Promise<TwitterAccount[]> {
        return this.twitterAccountRepository.getAllAccounts()
    }
}
