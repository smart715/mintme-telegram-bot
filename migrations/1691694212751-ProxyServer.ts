import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProxyServer1691694212751 implements MigrationInterface {
    public name = 'ProxyServer1691694212751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`proxy_server\` (\`id\` int NOT NULL AUTO_INCREMENT, \`proxy\` varchar(255) NOT NULL, \`auth_info\` varchar(255) NOT NULL, \`is_disabled\` tinyint NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
        await queryRunner.query(`ALTER TABLE \`telegram_account\` ADD \`proxy_id\` int NULL`)
        await queryRunner.query(`ALTER TABLE \`telegram_account\` ADD UNIQUE INDEX \`IDX_236a6f7ac683f5e770df2f5d8e\` (\`proxy_id\`)`)
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_236a6f7ac683f5e770df2f5d8e\` ON \`telegram_account\` (\`proxy_id\`)`)
        await queryRunner.query(`ALTER TABLE \`telegram_account\` ADD CONSTRAINT \`FK_236a6f7ac683f5e770df2f5d8ea\` FOREIGN KEY (\`proxy_id\`) REFERENCES \`proxy_server\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` DROP FOREIGN KEY \`FK_236a6f7ac683f5e770df2f5d8ea\``)
        await queryRunner.query(`DROP INDEX \`REL_236a6f7ac683f5e770df2f5d8e\` ON \`telegram_account\``)
        await queryRunner.query(`ALTER TABLE \`telegram_account\` DROP INDEX \`IDX_236a6f7ac683f5e770df2f5d8e\``)
        await queryRunner.query(`ALTER TABLE \`telegram_account\` DROP COLUMN \`proxy_id\``)
        await queryRunner.query(`DROP TABLE \`proxy_server\``)
    }
}
