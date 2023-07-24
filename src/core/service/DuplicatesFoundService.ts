import { DuplicatesFoundRepository } from '../repository'
import { UpdateResult } from 'typeorm'
import { DuplicatesFound } from '../entity'

export class DuplicatesFoundService {
    public constructor(
        private readonly duplicatesFoundRepository: DuplicatesFoundRepository,
    ) {}

    public async increment(source: string): Promise<UpdateResult> {
        const duplicatesFound = await this.duplicatesFoundRepository.findOne({ source })

        if (!duplicatesFound) {
            await this.insert(source)
        }

        return this.duplicatesFoundRepository.increment({ source }, 'duplicates', 1)
    }

    private async insert(source: string): Promise<void> {
        const duplicatesFound = new DuplicatesFound()
        duplicatesFound.source = source

        await this.duplicatesFoundRepository.insert(duplicatesFound)
    }
}
