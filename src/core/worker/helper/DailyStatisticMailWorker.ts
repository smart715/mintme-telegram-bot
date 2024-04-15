/* eslint-disable @typescript-eslint/naming-convention */
import config from 'config'
import { Logger } from 'winston'
import { singleton } from 'tsyringe'
import { ContactHistoryService, MailerService, TokensService } from '../../service'
import { GroupedContactsCount, TokensCountGroupedBySourceAndBlockchain } from '../../types'

interface ContactingWorkersInfo {
    [key: string]: {
        total: number,
        failed: number,
        success: number,
        ETH: number,
        BSC: number,
        CRO: number,
        MATIC: number,
        SOL: number,
        AVAX: number,
        ARB: number,
        BASE: number,
    },
}

interface TokenWorkersInfo {
    [key: string]: {
        total: number,
        CRO: number,
        BSC: number,
        ETH: number,
        MATIC: number,
        SOL: number,
        ARB: number,
        AVAX: number,
        BASE: number,
    },
}

@singleton()
export class DailyStatisticMailWorker {
    private readonly prefixLog = '[DailyStatisticWorker]'
    private readonly email: string = config.get('email_daily_statistic')

    public constructor(
        private readonly tokenService: TokensService,
        private readonly mailerService: MailerService,
        private readonly contactHistoryService: ContactHistoryService,
        private readonly logger: Logger
    ) { }

    public async run(): Promise<void> {
        const emailBody = await this.buildEmailBody()

        this.logger.info(`${this.prefixLog} Sending workers statistic mail...`)

        await this.mailerService.sendEmail(this.email, 'Daily Statistic', emailBody)

        this.logger.info(`${this.prefixLog} Finished`)
    }

    private async buildEmailBody(): Promise<string> {
        const now = new Date()
        const fromDate = new Date()
        fromDate.setHours(now.getHours() - 24)

        this.logger.info(`${this.prefixLog} Building token workers statistic...`)
        const tokensWorkersMsg = await this.buildTokenWorkersMsg(fromDate)

        this.logger.info(`${this.prefixLog} Building contacting workers statistic...`)
        const contactingWorkersMsg = await this.buildContactingWorkersMsg(fromDate)

        return tokensWorkersMsg + contactingWorkersMsg
    }

    private async buildTokenWorkersMsg(fromDate: Date): Promise<string> {
        const tokens = await this.tokenService.getCountGroupedBySourceAndBlockchain(fromDate)

        const groupedWebsiteParserInfo = this.groupWebsiteParsersInfo(tokens)

        let msg = 'Daily Statistic (website parsers): <br>'

        if (0 === Object.keys(groupedWebsiteParserInfo).length) {
            msg += `No tokens were added today`

            return msg
        }

        for (const [ worker, workerInfo ] of Object.entries(groupedWebsiteParserInfo)) {
            msg += `<strong>${worker}</strong>: ETH - ${workerInfo.ETH}, BSC - ${workerInfo.BSC}, CRO - ${workerInfo.CRO}. ` +
                `<strong>Total added</strong> - ${workerInfo.total} tokens<br>`
        }

        return msg
    }

    private async buildContactingWorkersMsg(fromDate: Date): Promise<string> {
        const contacts = await this.contactHistoryService.getTotalCountGroupedByContactMethod(fromDate)

        const groupedContactingWorkersInfo = this.groupContactingWorkersInfo(contacts)

        let msg = '<br>Daily Statistic (contacting workers): <br>'

        if (0 === Object.keys(groupedContactingWorkersInfo).length) {
            msg += `No users were contacted today`

            return msg
        }

        for (const [ contactMethod, contactInfo ] of Object.entries(groupedContactingWorkersInfo)) {
            msg += `<strong>${contactMethod}</strong>: ` +
                `Success - ${contactInfo.success}. ` +
                `Failed - ${contactInfo.failed}. ` +
                `Crypto: ETH - ${contactInfo.ETH}, BSC - ${contactInfo.BSC}, CRO - ${contactInfo.CRO}. ` +
                `<strong>Total</strong> - ${contactInfo.total} contacts<br>`
        }

        return msg
    }

    private groupWebsiteParsersInfo(tokens: TokensCountGroupedBySourceAndBlockchain[]): TokenWorkersInfo {
        const grouped: TokenWorkersInfo = {}

        for (const token of tokens) {
            const currentTokenSource = grouped[token.source]

            if (!currentTokenSource) {
                grouped[token.source] = { total: 0, ETH: 0, BSC: 0, CRO: 0, MATIC: 0, SOL: 0, ARB: 0, AVAX: 0, BASE: 0 }
            }

            grouped[token.source][token.blockchain] = parseInt(token.tokens)
            grouped[token.source].total += parseInt(token.tokens)
        }

        return grouped
    }

    private groupContactingWorkersInfo(contacts: GroupedContactsCount[]): ContactingWorkersInfo {
        const grouped: ContactingWorkersInfo = {}

        for (const contact of contacts) {
            const currentContactSource = grouped[contact.contact_method]

            if (!currentContactSource) {
                grouped[contact.contact_method] = {
                    total: 0,
                    failed: 0,
                    success: 0,
                    ETH: 0,
                    BSC: 0,
                    CRO: 0,
                    MATIC: 0,
                    SOL: 0,
                    AVAX: 0,
                    ARB: 0,
                    BASE: 0,
                }
            }

            grouped[contact.contact_method][contact.blockchain] = parseInt(contact.tokens)

            if (contact.is_success) {
                grouped[contact.contact_method].success += parseInt(contact.tokens)
            } else {
                grouped[contact.contact_method].failed += parseInt(contact.tokens)
            }

            grouped[contact.contact_method].total += parseInt(contact.tokens)
        }

        return grouped
    }
}
