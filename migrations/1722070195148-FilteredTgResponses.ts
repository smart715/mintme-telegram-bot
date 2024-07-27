import { MigrationInterface, QueryRunner } from 'typeorm'

export class FilteredTgResponses1722070195148 implements MigrationInterface {
    public name = 'FilteredTgResponses1722070195148'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_response\` ADD \`chat_messages_filtered\` longtext NOT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_response\` DROP COLUMN \`chat_messages_filtered\``)
    }
}
