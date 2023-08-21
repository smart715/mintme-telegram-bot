import { MigrationInterface, QueryRunner } from 'typeorm'

export class QueuedContactAdditionalColumn1692468760753 implements MigrationInterface {
    public name = 'QueuedContactAdditionalColumn1692468760753'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`queued_contact\` ADD \`contact_method\` varchar(32) NOT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`queued_contact\` DROP COLUMN \`contact_method\``)
    }
}
