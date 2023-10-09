import { MigrationInterface, QueryRunner } from 'typeorm'

export class TelegramRemoveUnusedColumn1695344364389 implements MigrationInterface {
    public name = 'TelegramRemoveUnusedColumn1695344364389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` DROP COLUMN \`assigned_server_ip\``)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` ADD \`assigned_server_ip\` varchar(255) NULL`)
    }
}
