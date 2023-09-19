import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProxyServer1691694212751 implements MigrationInterface {
    public name = 'ProxyServer1691694212751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`proxy_server\` (\`id\` int NOT NULL AUTO_INCREMENT, \`proxy\` varchar(255) NOT NULL, \`auth_info\` varchar(255) NOT NULL, \`is_disabled\` tinyint NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
        await queryRunner.query(`ALTER TABLE \`telegram_account\` ADD \`proxy_id\` int NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` DROP COLUMN \`proxy_id\``)
        await queryRunner.query(`DROP TABLE \`proxy_server\``)
    }
}
