// @ts-nocheck
import config from 'config'
import { Logger } from 'winston'
import { singleton } from 'tsyringe'
import {ContactHistoryService, MailerService, TokensService} from '../../service'
import { TokensCountGroupedBySource } from '../../../types'

interface WebsiteParsersInfo {
    total: number;
    CRO: number;
    BSC: number;
    ETH: number
}

@singleton()
export class DailyStatisticMailWorker {
    private readonly email: string = config.get('email_daily_statistic')

    constructor(
        private readonly tokenService: TokensService,
        private readonly mailerService: MailerService,
        // private readonly contactHistoryService: ContactHistoryService,
        private readonly logger: Logger
    ) { }

    public async run(): Promise<void> {
        const now = new Date()
        const fromDate = new Date()
        fromDate.setHours(now.getHours() - 170)

        const tokens = await this.tokenService.getCountGroupedBySourceAndBlockchain(fromDate)

        const websiteParsersInfo = this.buildWebsiteParsersInfo(tokens)
        const tokensWorkerMsg = this.buildTokensWorkerMsg(websiteParsersInfo)

        await this.mailerService.sendEmail(this.email, 'Daily Statistic', tokensWorkerMsg)

        this.logger.info(JSON.stringify(tokens))
    }

    private buildWebsiteParsersInfo(tokens: TokensCountGroupedBySource[]): WebsiteParsersInfo[] {
        const sanitized: WebsiteParsersInfo[] = []

        for (const token of tokens) {
            const currentTokenSource = sanitized[token.source]

            if (!currentTokenSource) {
                sanitized[token.source] = { total: 0, ETH: 0, BSC: 0, CRO: 0 }
            }

            sanitized[token.source][token.blockchain] = parseInt(token.tokens)
            sanitized[token.source].total += parseInt(token.tokens)
        }

        return sanitized
    }

    private buildTokensWorkerMsg(websiteParsers: WebsiteParsersInfo[]): string {
        let msg = 'Daily Statistic: <br>'

        if (0 === Object.keys(websiteParsers).length) {
            msg += `No tokens were added today`

            return msg
        }

        for (const [worker, workerInfo] of Object.entries(websiteParsers)) {
            msg += `<strong>${worker}</strong>: ETH - ${workerInfo.ETH}, BSC - ${workerInfo.BSC}, CRO - ${workerInfo.CRO}. ` +
                `<strong>Total added</strong> - ${workerInfo.total} tokens<br>`
        }

        return msg
    }
}
