import { MigrationInterface, QueryRunner } from 'typeorm'

export class TelegramAccountResponseColumn1694113096363 implements MigrationInterface {
    public name = 'TelegramAccountResponseColumn1694113096363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` ADD \`last_responses_fetch_date\` datetime NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` DROP COLUMN \`last_responses_fetch_date\``)
    }
}
