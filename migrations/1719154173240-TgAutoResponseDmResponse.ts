import { MigrationInterface, QueryRunner } from 'typeorm'

export class TgAutoResponseDmResponse1719154173240 implements MigrationInterface {
    public name = 'TgAutoResponseDmResponse1719154173240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`telegram_auto_dm_response\` (\`id\` int NOT NULL AUTO_INCREMENT, \`message\` text NOT NULL, \`order\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`telegram_auto_dm_response\``)
    }
}
