import nodemailer from 'nodemailer'
import { singleton } from 'tsyringe'
import config from 'config'

@singleton()
export class MailerService {
    private readonly sender = `${config.get('mailer.senderName')} <${config.get('mailer.senderEmail')}>`
    private readonly dailyStatisticReceiver = config.get('email_daily_statistic') as string
    private readonly mailer: nodemailer.Transporter

    public constructor() {
        this.mailer = nodemailer.createTransport({
            host: config.get('mailer.host'),
            port: config.get('mailer.port'),
            secure: config.get('mailer.secure'),
            auth: {
                user: config.get('mailer.auth.user'),
                pass: config.get('mailer.auth.pass'),
            },
        })
    }

    public async sendEmail(receiverEmail: string, header: string, body: string): Promise<boolean> {
        const response = await this.mailer.sendMail({
            from: this.sender,
            to: receiverEmail,
            subject: header,
            text: body,
        })

        return this.isResponseOk(response, receiverEmail)
    }

    public async sendFailedWorkerEmail(message: string, error: any = null): Promise<boolean> {
        const body = error
            ? message + ': ' + JSON.stringify(error, Object.getOwnPropertyNames(error))
            : message

        return this.sendEmail(
            this.dailyStatisticReceiver,
            'Worker Failed',
            body
        )
    }

    private isResponseOk(response: any, receiverEmail: string): boolean {
        return response.response.includes('250')
            && response.accepted.includes(receiverEmail)
            && 0 === response.rejected.length
    }
}
