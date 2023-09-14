import { MigrationInterface, QueryRunner } from 'typeorm'

export class EditProxyServerRelationship1694390441515 implements MigrationInterface {
    public name = 'EditProxyServerRelationship1694390441515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` ADD CONSTRAINT \`FK_236a6f7ac683f5e770df2f5d8ea\` FOREIGN KEY (\`proxy_id\`) REFERENCES \`proxy_server\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` DROP FOREIGN KEY \`FK_236a6f7ac683f5e770df2f5d8ea\``)
    }
}
