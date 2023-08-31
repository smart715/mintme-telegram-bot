import { singleton } from 'tsyringe'
import { QueuedContactRepository } from '../repository'
import { QueuedContact } from '../entity'
import { Brackets } from 'typeorm'
import config from 'config'
import moment from 'moment'
import { Blockchain } from '../../utils'
import { ContactMethod } from '../types'
import axios from 'axios'
import { Logger } from 'winston'

@singleton()
export class ContactQueueService {
    private isFetchingQueue = false

    public constructor(
        private readonly queuedContactRepository: QueuedContactRepository,
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
            const delayInSeconds = parseInt(config.get('contact_frequency_in_seconds'))

            const result = await this.queuedContactRepository
                .createQueryBuilder('queued_contact')
                .leftJoin('token', 'token', 'queued_contact.address = token.address AND queued_contact.blockchain = token.blockchain')
                .where('queued_contact.is_processing = 0')
                .andWhere('queued_contact.contact_method = :contactMethod', { contactMethod })
                .andWhere(new Brackets((qb) => qb
                    .where('queued_contact.is_planned = 0')
                    .orWhere(
                        'queued_contact.created_at < :thresholdDate',
                        { thresholdDate: moment().utc().subtract(delayInSeconds, 'second').format() }
                    )
                ))
                .orderBy('token.created_at', 'DESC')
                .getOne();

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

    public async isExistingTg(link: string, logger: Logger): Promise<boolean> {
        try {
            const request = await axios.get(link)
            return (request.data.includes('tgme_page_title') && !request.data.includes(' subscribers'))
        } catch (e) {
            logger.error(e)
            return false
        }
    }
}
