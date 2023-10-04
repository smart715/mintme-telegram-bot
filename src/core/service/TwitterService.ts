import { singleton } from 'tsyringe'
import { TwitterAccount } from '../entity'
import { TwitterAccountRepository, TwitterResponseRepository } from '../repository'

@singleton()
export class TwitterService {
    public constructor(
        private readonly twitterAccountRepository: TwitterAccountRepository,
        private readonly twitterResponseRepository: TwitterResponseRepository
    ) { }

    public async getAllAccounts(): Promise<TwitterAccount[]> {
        return this.twitterAccountRepository.getAllAccounts()
    }

    public async updateResponsesLastChecked(twitterAccount: TwitterAccount): Promise<void> {
        twitterAccount.lastResponsesFetchDate = new Date()
        await this.twitterAccountRepository.save(twitterAccount)
    }

    public async setAccountAsDisabled(twitterAccount: TwitterAccount): Promise<void> {
        twitterAccount.isDisabled = true
        await this.twitterAccountRepository.save(twitterAccount)
    }

    public async addNewResponse(
        messageTitle: string,
        userName: string,
        twitterAccount: TwitterAccount
    ): Promise<void> {
        const isExisting = await this.twitterResponseRepository.isExistingReponse(messageTitle, userName)

        if (isExisting) {
            return
        }

        const twittterResponse = this.twitterResponseRepository.create({
            isChecked: false,
            messageTitle: messageTitle,
            userName: userName,
            twitterAccount: twitterAccount,
        })

        await this.twitterResponseRepository.insert(twittterResponse)
    }
}
