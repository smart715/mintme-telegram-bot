import { singleton } from 'tsyringe'
import { CheckedTokenRepository } from '../repository'
import { CheckedToken } from '../entity'

@singleton()
export class CheckedTokenService {
    public constructor(
        private checkedTokenRepository: CheckedTokenRepository
    ) {}

    public async saveAsChecked(tokenId: string, source: string): Promise<CheckedToken> {
        const checkedToken = new CheckedToken(tokenId, source)

        await this.checkedTokenRepository.save(checkedToken)

        return checkedToken
    }

    public async isChecked(tokenId: string, source: string): Promise<boolean> {
        const tokens = await this.checkedTokenRepository.count({ tokenId, source })

        return tokens > 0
    }
}
