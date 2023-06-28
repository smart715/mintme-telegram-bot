import { singleton } from "tsyringe"
import { EntityRepository, Repository } from "typeorm"
import { CroToken } from "../entity/CroToken"

@singleton()
@EntityRepository(CroToken)
export class CroTokensRepository extends Repository<CroToken> {
    public async findByAddress(address: string): Promise<CroToken | undefined> {
        return this.findOne({where: {tokenAddress: address}})
    }
}