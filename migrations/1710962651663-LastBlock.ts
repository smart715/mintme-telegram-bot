import { MigrationInterface, QueryRunner } from 'typeorm'

export class LastBlock1710962651663 implements MigrationInterface {
    public name = 'LastBlock1710962651663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`last_block\` (\`id\` int NOT NULL AUTO_INCREMENT, \`blockchain\` varchar(255) NOT NULL, \`block_hash\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`last_block\``)
    }
}
