import { singleton } from 'tsyringe'
import { QueuedContactRepository } from '../repository'
import { QueuedContact, Token } from '../entity'
import { Blockchain, sleep } from '../../utils'
import { ContactMethod, TelegramChannelCheckResultType, TokenContactStatusType } from '../types'
import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from 'winston'
import { TokensService } from './TokensService'
import { ProxyService } from './ProxyServerService'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { ContactHistoryService } from './ContactHistoryService'

@singleton()
export class ContactQueueService {
    private isFetchingQueue = false

    public constructor(
        private readonly queuedContactRepository: QueuedContactRepository,
        private readonly tokenService: TokensService,
        private readonly proxyService: ProxyService,
        private readonly contactHistoryService: ContactHistoryService,
    ) { }

    public async addToQueue(
        address: string,
        blockchain: Blockchain,
        channel: string,
        isFutureContact: boolean = false,
        contactMethod: ContactMethod
    ): Promise<QueuedContact> {
        const queuedContact = new QueuedContact()

        queuedContact.address = address
        queuedContact.blockchain = blockchain
        queuedContact.channel = channel
        queuedContact.isPlanned = isFutureContact
        queuedContact.contactMethod = contactMethod

        await this.queuedContactRepository.insert(queuedContact)

        return queuedContact
    }

    public async removeFromQueue(
        address: string,
        blockchain: Blockchain,
    ): Promise<void> {
        await this.queuedContactRepository.delete({ address, blockchain })
    }

    public async getFirstFromQueue(contactMethod: ContactMethod, logger: Logger): Promise<QueuedContact | undefined> {
        try {
            while (this.isFetchingQueue) {
                await new Promise(resolve => setTimeout(resolve, 500))
            }
            this.isFetchingQueue = true

            const result = await this.queuedContactRepository
                .createQueryBuilder('queued_contact')
                .leftJoin('token', 'token', 'queued_contact.address = token.address AND queued_contact.blockchain = token.blockchain')
                .where('queued_contact.is_processing = 0')
                .andWhere('queued_contact.contact_method = :contactMethod', { contactMethod })
                .orderBy('token.created_at', 'DESC')
                .getOne()

            if (result) {
                await this.setProcessing(result)
            }

            this.isFetchingQueue = false
            return result
        } catch (e) {
            this.isFetchingQueue = false
            logger.error(e)
            return undefined
        }
    }

    public async setProcessing(queuedContact: QueuedContact, value: boolean = true): Promise<QueuedContact> {
        queuedContact.isProcessing = value

        return this.queuedContactRepository.save(queuedContact)
    }

    public async isQueuedAddress(address: string): Promise<boolean> {
        const find = await this.queuedContactRepository.createQueryBuilder()
            .where('address = :address', { address })
            .getCount()
        return (find > 0)
    }

    public async isQueuedChannel(channel: string): Promise<boolean> {
        const find = await this.queuedContactRepository.createQueryBuilder()
            .where('channel = :channel', { channel })
            .getCount()
        return (find > 0)
    }

    public async checkTelegramChannel(
        link: string,
        logger: Logger,
        retries: number = 0): Promise<TelegramChannelCheckResultType> {
        try {
            if (0 === retries) {
                const isChannelCanBeContacted = await this.contactHistoryService.isChannelCanBeContacted(link)

                if (!isChannelCanBeContacted) {
                    return TelegramChannelCheckResultType.FREQUENCY_LIMIT
                }
            }

            const proxy = await this.proxyService.getRandomProxy()
            let axiosConfig: AxiosRequestConfig<any> | undefined

            if (proxy) {
                const proxyInfo = proxy.proxy.replace('http://', '')
                const httpsAgent = new HttpsProxyAgent(`http://${proxy.authInfo}@${proxyInfo}`)
                axiosConfig = {
                    httpsAgent,
                }
            }

            const request = await axios.get(link, axiosConfig)

            if (200 === request.status && request.data.includes('<title>Telegram: Contact')) {
                if (request.data.includes(' subscribers')) {
                    return TelegramChannelCheckResultType.ANNOUNCEMENTS_CHANNEL
                }

                if (request.data.includes('tgme_page_title')) {
                    return TelegramChannelCheckResultType.ACTIVE
                }
            }

            if (retries >= 2) {
                return TelegramChannelCheckResultType.NOT_ACTIVE
            }

            await sleep(5000)
            return this.checkTelegramChannel(link, logger, ++retries)
        } catch (e) {
            logger.error(`${e}, Retry #${retries}`)

            if (retries >= 2) {
                return TelegramChannelCheckResultType.ERROR
            }

            return this.checkTelegramChannel(link, logger, ++retries)
        }
    }

    public async preContactCheckAndCorrect(
        queuedContact: QueuedContact,
        token: Token,
        logger: Logger
    ): Promise<boolean> {
        if (TokenContactStatusType.RESPONDED === token.contactStatus) {
            await this.removeFromQueue(queuedContact.address, queuedContact.blockchain)

            logger.info(
                `token ${queuedContact.address} :: ${queuedContact.blockchain} was marked as responded . Skipping`
            )

            return false
        }

        const isChannelOfRespondedToken = await this.tokenService.isChannelOfRespondedToken(queuedContact)

        if (isChannelOfRespondedToken) {
            token.contactStatus = TokenContactStatusType.RESPONDED
            this.tokenService.update(token)

            await this.removeFromQueue(queuedContact.address, queuedContact.blockchain)

            logger.info(
                `Token for ${queuedContact.address} :: ${queuedContact.blockchain} (${queuedContact.channel}) owner have another responded token. Removed from queue. Skipping`
            )

            return false
        }

        return true
    }

    public async resetProcessingStat(contactMethod: ContactMethod): Promise<void> {
        await this.queuedContactRepository.createQueryBuilder()
            .update(QueuedContact)
            .set({ isProcessing: false })
            .where('contact_method = :contactMethod', { contactMethod })
            .andWhere('is_processing = 1')
            .execute()
    }
}
