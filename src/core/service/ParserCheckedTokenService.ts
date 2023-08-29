import { singleton } from 'tsyringe'
import { ParserCheckedTokenRepository } from '../repository'
import { ParserCheckedToken } from '../entity'

@singleton()
export class ParserCheckedTokenService {
    public constructor(
        private parserCheckedTokenRepository: ParserCheckedTokenRepository
    ) {}

    public async getIdsBySource(source: string): Promise<ParserCheckedToken[]> {
        return this.parserCheckedTokenRepository.findIdsBySource(source)
    }

    public async saveAsChecked(tokenId: string, source: string): Promise<ParserCheckedToken> {
        const checkedToken = new ParserCheckedToken(tokenId, source)

        await this.parserCheckedTokenRepository.save(checkedToken)

        return checkedToken
    }

    public async isChecked(tokenId: string, source: string): Promise<boolean> {
        const tokens = await this.parserCheckedTokenRepository.count({ tokenId, source })

        return tokens > 0
    }
}
