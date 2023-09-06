// @ts-nocheck
import config from 'config'
import { Logger } from 'winston'
import { singleton } from 'tsyringe'
import { ContactHistoryService, MailerService, TokensService } from '../../service'
import {GroupedContactsCount, TokensCountGroupedBySourceAndBlockchain} from '../../../types'

@singleton()
export class DailyStatisticMailWorker {
    private readonly email: string = config.get('email_daily_statistic')

    constructor(
        private readonly tokenService: TokensService,
        private readonly mailerService: MailerService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly logger: Logger
    ) { }

    public async run(): Promise<void> {
        const emailBody = await this.buildEmailBody()

        await this.mailerService.sendEmail(this.email, 'Daily Statistic', emailBody)
    }

    private async buildEmailBody(): Promise<string> {
        const now = new Date()
        const fromDate = new Date()
        fromDate.setHours(now.getHours() - 170)

        const tokensWorkersMsg = await this.buildTokenWorkersMsg(fromDate)
        const contactingWorkersMsg = await this.buildContactingWorkersMsg(fromDate)

        return tokensWorkersMsg
    }

    private async buildContactingWorkersMsg(fromDate: Date): Promise<string> {
        const contacts = await this.contactHistoryService.getTotalCountGroupedByContactMethod(fromDate)
        const groupedContactingWorkersInfo = this.groupContactingWorkersInfo(contacts)


    }

    private groupContactingWorkersInfo(contacts: GroupedContactsCount[]): Promise<{
        total: number,
        failed: number,
        success: number,
        CRO: number,
        BSC: number,
        ETH: number,
    }[]> {
        const grouped = []

        for (const contact of contacts) {
            const currentContactSource = grouped[contact.contact_method]

            if (!currentContactSource) {
                grouped[contact.contact_method] = { total: 0, failed: 0, success: 0, ETH: 0, BSC: 0, CRO: 0 }
            }

            grouped[contact.contact_method][contact.blockchain] = parseInt(contact.tokens)

            if (contact.is_success) {
                grouped[contact.contact_method][contact.
            } else {

            }

            grouped[contact.contact_method][contact.blockchain] = parseInt(contact.tokens)
            grouped[contact.contact_method].total += parseInt(contact.tokens)
        }

        return grouped
    }

    private async buildTokenWorkersMsg(fromDate): Promise<string> {
        const tokens = await this.tokenService.getCountGroupedBySourceAndBlockchain(fromDate)
        const groupedWebsiteParserInfo = this.groupWebsiteParsersInfo(tokens)

        let msg = 'Daily Statistic: <br>'

        if (0 === Object.keys(groupedWebsiteParserInfo).length) {
            msg += `No tokens were added today`

            return msg
        }

        for (const [worker, workerInfo] of Object.entries(groupedWebsiteParserInfo)) {
            msg += `<strong>${worker}</strong>: ETH - ${workerInfo.ETH}, BSC - ${workerInfo.BSC}, CRO - ${workerInfo.CRO}. ` +
                `<strong>Total added</strong> - ${workerInfo.total} tokens<br>`
        }

        return msg
    }

    private groupWebsiteParsersInfo(tokens: TokensCountGroupedBySourceAndBlockchain[]): {
        total: number,
        CRO: number,
        BSC: number,
        ETH: number,
    }[] {
        const grouped = []

        for (const token of tokens) {
            const currentTokenSource = grouped[token.source]

            if (!currentTokenSource) {
                grouped[token.source] = { total: 0, ETH: 0, BSC: 0, CRO: 0 }
            }

            grouped[token.source][token.blockchain] = parseInt(token.tokens)
            grouped[token.source].total += parseInt(token.tokens)
        }

        return grouped
    }
}
