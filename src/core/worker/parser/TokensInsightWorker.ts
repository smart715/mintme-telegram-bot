import { AbstractTokenWorker } from '../AbstractTokenWorker'
import { singleton } from 'tsyringe'
import { Blockchain, logger } from '../../../utils'
import { TokensInsightService, TokensService } from '../../service'
import {TokensInsightAllCoinsResponse} from "../../../types/TokensInsight";

@singleton()
export class TokensInsightWorker extends AbstractTokenWorker {
    private readonly workerName = 'TokensInsight'
    private readonly prefixLog = `[${this.workerName}]`
    private readonly limit = 1500

    public constructor(
        private readonly tokensInsightService: TokensInsightService,
        private readonly tokensService: TokensService,
    ) {
        super()
    }

    public async run(currentBlockchain: Blockchain): Promise<void> {
        let offset = 0
        let fetchNext = true

        do {
            let allCoinsRes: TokensInsightAllCoinsResponse

            try {
                allCoinsRes = await this.tokensInsightService.getAllCoins(offset, this.limit)
            } catch (ex: any) {
                logger.error(
                    `${this.prefixLog} Aborting. Failed to fetch all coins. Offset: ${offset}. Limit: ${this.limit} Reason: ${ex.message}`
                )

                continue
            }

            if ()

            offset += this.limit
        } while (fetchNext)
    }
}
