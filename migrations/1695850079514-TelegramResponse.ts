import { MigrationInterface, QueryRunner } from 'typeorm'

export class TelegramResponse1695850079514 implements MigrationInterface {
    public name = 'TelegramResponse1695850079514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`telegram_response\` (\`id\` int NOT NULL AUTO_INCREMENT, \`chat_link\` varchar(255) NOT NULL, \`chat_messages\` longtext NOT NULL, \`is_checked\` tinyint NOT NULL, \`type\` varchar(255) NOT NULL, \`telegam_account_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
        await queryRunner.query(`ALTER TABLE \`telegram_response\` ADD CONSTRAINT \`FK_8663083f184f857daa3cd0bcc43\` FOREIGN KEY (\`telegam_account_id\`) REFERENCES \`telegram_account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_response\` DROP FOREIGN KEY \`FK_8663083f184f857daa3cd0bcc43\``)
        await queryRunner.query(`DROP TABLE \`telegram_response\``)
    }
}
