import { singleton } from 'tsyringe'
import { ChannelStatusRepository } from '../repository'
import { In } from 'typeorm'
import { ChannelStatus } from '../entity'
import { ChannelStatusType } from '../types'
import { Blockchain, getMaxAttemptsPerMethod, parseContactMethod } from '../../utils'

@singleton()
export class ChannelStatusService {
    public constructor(
        private readonly channelStatusRepository: ChannelStatusRepository,
    ) {}

    public getContactsByChannels(channels: string[]): Promise<ChannelStatus[]> {
        return this.channelStatusRepository.find({ where: { channel: In(channels) } })
    }

    public getFirstAvailableChannelCached(
        channels: string[],
        channelStatuses: ChannelStatus[],
        address: string,
        blockchain: string,
    ): string {
        const activeChannelMap = channelStatuses.reduce((acc: {[key: string]: boolean}, channelStatus) => {
            if (false === acc[channelStatus.channel]) {
                return acc
            }

            acc[channelStatus.channel] = ChannelStatusType.ACTIVE === channelStatus.status

            return acc
        }, {})

        return channels.find((channel) => {
            const method = parseContactMethod(channel)

            if (!method) {
                return false
            }

            for (let i = 0; i < channelStatuses.length; i++) {
                if (channelStatuses[i].channel !== channel) {
                    continue
                }

                if (!activeChannelMap[channel]) {
                    return false
                }

                if (channelStatuses[i].address === address
                    && channelStatuses[i].blockchain === blockchain
                    && channelStatuses[i].attemptsAmount >= getMaxAttemptsPerMethod(method)
                ) {
                    return false
                }
            }

            return true
        }) || ''
    }

    public async saveChannelStatus(
        channel: string,
        address: string,
        blockchain: Blockchain,
        status: ChannelStatusType
    ): Promise<void> {
        const dbChannelStatus = await this.channelStatusRepository.findOne({
            channel,
            blockchain,
            address,
        })

        if (dbChannelStatus) {
            dbChannelStatus.status = status
            dbChannelStatus.attemptsAmount += 1
            await this.channelStatusRepository.save(dbChannelStatus)
        } else {
            const channelStatus = new ChannelStatus(address, blockchain, channel, status)
            channelStatus.attemptsAmount++

            await this.channelStatusRepository.insert(channelStatus)
        }
    }
}
