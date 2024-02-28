import { MigrationInterface, QueryRunner } from 'typeorm'

export class CmcCommentingWOrker1709112401501 implements MigrationInterface {
    public name = 'CmcCommentingWOrker1709112401501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`coin_market_cap_account\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_name\` varchar(255) NOT NULL, \`is_disabled\` tinyint NOT NULL, \`cookies_json\` text NOT NULL, \`local_storage_json\` text NOT NULL, \`last_login\` datetime NULL, \`continous_failed\` int NOT NULL DEFAULT '0', \`proxy_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
        await queryRunner.query(`CREATE TABLE \`coin_market_cap_comment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
        await queryRunner.query(`CREATE TABLE \`coin_market_cap_comment_history\` (\`id\` int NOT NULL AUTO_INCREMENT, \`coin_id\` varchar(80) NOT NULL, \`comment_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`account_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` ADD CONSTRAINT \`FK_4e1a0b5c1d0d48f7b910ff155c3\` FOREIGN KEY (\`proxy_id\`) REFERENCES \`proxy_server\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` DROP FOREIGN KEY \`FK_4e1a0b5c1d0d48f7b910ff155c3\``)
        await queryRunner.query(`DROP TABLE \`coin_market_cap_comment_history\``)
        await queryRunner.query(`DROP TABLE \`coin_market_cap_comment\``)
        await queryRunner.query(`DROP TABLE \`coin_market_cap_account\``)
    }
}
