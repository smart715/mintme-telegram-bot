import { singleton } from 'tsyringe';
import { QueuedContactRepository } from '../repository';
import { QueuedContact } from '../entity';
import { Brackets } from 'typeorm';
import config from 'config'
import moment from 'moment';
import { Blockchain } from '../../utils';

@singleton()
export class ContactQueueService {
    public constructor(
        private readonly queuedContactRepository: QueuedContactRepository,
    ) {}

    public async addToQueue(
        address: string,
        blockchain: Blockchain,
        channel: string,
        isFutureContact: boolean = false,
    ): Promise<QueuedContact> {
        const queuedContact = new QueuedContact()

        queuedContact.address = address
        queuedContact.blockchain = blockchain
        queuedContact.channel = channel
        queuedContact.isPlanned = isFutureContact

        await this.queuedContactRepository.insert(queuedContact)

        return queuedContact
    }

    public async removeFromQueue(
        address: string,
        blockchain: Blockchain,
    ): Promise<void> {
        await this.queuedContactRepository.delete({address, blockchain})
    }

    public async getFirstFromQueue(): Promise<QueuedContact | undefined> {
        const delayInSeconds = parseInt(config.get('contact_frequency_in_seconds'))

        return await this.queuedContactRepository
            .createQueryBuilder()
            .where('is_processing = 0')
            .andWhere(new Brackets((qb) => qb
                .where('is_planned = 0')
                .orWhere(
                    'created_at < :thresholdDate',
                    {thresholdDate: moment().utc().subtract(delayInSeconds, 'second').format()}
                )
            ))
            .getOne()
    }

    public async setProcessing(queuedContact: QueuedContact): Promise<QueuedContact> {
        queuedContact.isProcessing = true

        return this.queuedContactRepository.save(queuedContact)
    }
}
