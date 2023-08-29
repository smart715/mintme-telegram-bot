import { MigrationInterface, QueryRunner } from 'typeorm'

export class CheckedToken1692783793615 implements MigrationInterface {
    public name = 'CheckedToken1692783793615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`checked_token\`
            (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`token_id\` varchar(255) NOT NULL,
                \`source\` varchar(255) NOT NULL,
                \`updated_at\` int NOT NULL,
                INDEX \`IDX_SOURCE\` (\`source\`),
                UNIQUE INDEX \`UQ_TOKEN_ID_SOURCE\` (\`token_id\`, \`source\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`UQ_TOKEN_ID_SOURCE\` ON \`parser_checked_token\``)
        await queryRunner.query(`DROP INDEX \`IDX_SOURCE\` ON \`parser_checked_token\``)
        await queryRunner.query(`DROP TABLE \`parser_checked_token\``)
    }
}
