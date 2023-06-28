import { singleton } from "tsyringe"
import { EntityRepository, Repository } from "typeorm"
import { EtherscanToken } from "../entity/EtherscanToken"

@singleton()
@EntityRepository(EtherscanToken)
export class EtherscanTokensRepository extends Repository<EtherscanToken> {
    public async findByAddress(address: string): Promise<EtherscanToken | undefined> {
        return this.findOne({where: {tokenAddress: address}})
    }
}