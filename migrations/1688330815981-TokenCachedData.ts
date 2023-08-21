import { MigrationInterface, QueryRunner } from 'typeorm'

export class TokenCachedData1688330815981 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`token_cached_data\`
            (
                \`id\`          int          NOT NULL AUTO_INCREMENT,
                \`token_id\`    varchar(255) NOT NULL,
                \`source\`      varchar(255) NOT NULL,
                \`data\`        TEXT         DEFAULT NULL,
                \`updated_at\`  int          NOT NULL,
                UNIQUE INDEX \`UQ_TOKEN_ID_SOURCE\` (\`token_id\`, \`source\`),
                INDEX \`IDX_SOURCE\` (\`source\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`UQ_TOKEN_ID_SOURCE\` ON \`token_cached_data\``)
        await queryRunner.query(`DROP INDEX \`IDX_SOURCE\` ON \`token_cached_data\``)
        await queryRunner.query(`DROP TABLE \`token_cached_data\``)
    }
}
