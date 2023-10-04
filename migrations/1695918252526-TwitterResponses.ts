import { MigrationInterface, QueryRunner } from 'typeorm'

export class TwitterResponses1695918252526 implements MigrationInterface {
    public name = 'TwitterResponses1695918252526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`twitter_response\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_name\` varchar(255) NOT NULL, \`message_title\` longtext NOT NULL, \`is_checked\` tinyint NOT NULL, \`twitter_account_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
        await queryRunner.query(`ALTER TABLE \`twitter_account\` ADD \`last_responses_fetch_date\` datetime NULL`)
        await queryRunner.query(`ALTER TABLE \`twitter_response\` ADD CONSTRAINT \`FK_f9ee26945db69e867865d8d0b14\` FOREIGN KEY (\`twitter_account_id\`) REFERENCES \`twitter_account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`twitter_response\` DROP FOREIGN KEY \`FK_f9ee26945db69e867865d8d0b14\``)
        await queryRunner.query(`ALTER TABLE \`twitter_account\` DROP COLUMN \`last_responses_fetch_date\``)
        await queryRunner.query(`DROP TABLE \`twitter_response\``)
    }
}
