import { MigrationInterface, QueryRunner } from 'typeorm'

export class TelegramWorkerStuff1691667417232 implements MigrationInterface {
    public name = 'TelegramWorkerStuff1691667417232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`contact_message\` CHANGE \`allowed_blockchains\` \`account_id\` varchar(255) NULL`)
        await queryRunner.query(`CREATE TABLE \`telegram_account\` (\`id\` int NOT NULL AUTO_INCREMENT, \`phone_number\` varchar(255) NOT NULL, \`user_name\` varchar(255) NOT NULL, \`assigned_server_ip\` varchar(255) NULL, \`local_storage_json\` text NOT NULL, \`is_disabled\` tinyint NOT NULL, \`limit_hit_reset_date\` datetime NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
        await queryRunner.query(`ALTER TABLE \`contact_history\` ADD \`tg_account_id\` int NULL`)
        await queryRunner.query(`ALTER TABLE \`contact_history\` ADD \`twitter_account_id\` int NULL`)
        await queryRunner.query(`ALTER TABLE \`contact_message\` DROP COLUMN \`account_id\``)
        await queryRunner.query(`ALTER TABLE \`contact_message\` ADD \`account_id\` int NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`contact_message\` DROP COLUMN \`account_id\``)
        await queryRunner.query(`ALTER TABLE \`contact_message\` ADD \`account_id\` varchar(255) NULL`)
        await queryRunner.query(`ALTER TABLE \`contact_history\` DROP COLUMN \`tg_account_id\``)
        await queryRunner.query(`DROP TABLE \`telegram_account\``)
        await queryRunner.query(`ALTER TABLE \`contact_message\` CHANGE \`account_id\` \`allowed_blockchains\` varchar(255) NULL`)
    }
}
