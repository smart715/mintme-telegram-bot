import { singleton } from "tsyringe"
import { EntityRepository, Repository } from "typeorm"
import { BnbToken } from "../entity/BnbToken"

@singleton()
@EntityRepository(BnbToken)
export class BnbTokensRepository extends Repository<BnbToken> {
    public async findByAddress(address: string): Promise<BnbToken | undefined> {
        return this.findOne({where: {tokenAddress: address}})
    }
}