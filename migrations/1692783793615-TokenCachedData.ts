import { MigrationInterface, QueryRunner } from 'typeorm'

export class TokenCachedData1692783793615 implements MigrationInterface {
    public name = 'TokenCachedData1692783793615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`token_cached_data\`
            (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`token_id\` varchar(255) NOT NULL,
                \`source\` varchar(255) NOT NULL,
                \`data\` text NULL,
                \`updated_at\` int NOT NULL,
                INDEX \`IDX_SOURCE\` (\`source\`),
                UNIQUE INDEX \`UQ_TOKEN_ID_SOURCE\` (\`token_id\`, \`source\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`UQ_TOKEN_ID_SOURCE\` ON \`token_cached_data\``)
        await queryRunner.query(`DROP INDEX \`IDX_SOURCE\` ON \`token_cached_data\``)
        await queryRunner.query(`DROP TABLE \`token_cached_data\``)
    }
}
