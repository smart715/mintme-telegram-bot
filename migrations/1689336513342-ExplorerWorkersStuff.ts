import { MigrationInterface, QueryRunner } from 'typeorm'

export class ExplorerWorkersStuff1689336513342 implements MigrationInterface {
    public name = 'ExplorerWorkersStuff1689336513342'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`queued_token_address\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`token_address\` varchar(255) NOT NULL,
                \`blockchain\` varchar(255) NOT NULL,
                \`is_checked\` tinyint NOT NULL DEFAULT 0,
                UNIQUE INDEX \`UQ_QUEUED_TOKEN_ADDRESS_BLOCKCHAIN\` (\`token_address\`, \`blockchain\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
        await queryRunner.query(`
            CREATE TABLE \`queued_wallet_address\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`wallet_address\` varchar(255) NOT NULL,
                \`blockchain\` varchar(255) NOT NULL,
                \`is_checked\` tinyint NOT NULL DEFAULT 0,
                UNIQUE INDEX \`UQ_QUEUED_WALLET_ADDRESS_BLOCKCHAIN\` (\`wallet_address\`, \`blockchain\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
        await queryRunner.query(`
            CREATE TABLE \`duplicates_found\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`source\` varchar(255) NOT NULL,
                \`duplicates\` int NOT NULL DEFAULT '0',
                UNIQUE INDEX \`IDX_aae6a9f86440d80eb45f35bf9e\` (\`source\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
        await queryRunner.query(`
            CREATE TABLE \`last_checked_token_name\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`source\` varchar(255) NOT NULL,
                \`blockchain\` varchar(255) NOT NULL,
                \`token_name\` varchar(255) NOT NULL,
                UNIQUE INDEX \`UQ_LAST_CHECKED_NAME_SOURCE_BLOCKCHAIN\` (\`source\`, \`blockchain\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`last_checked_token_name\``)
        await queryRunner.query(`DROP TABLE \`duplicates_found\``)
        await queryRunner.query(`DROP TABLE \`queued_wallet_address\``)
        await queryRunner.query(`DROP TABLE \`queued_token_address\``)
    }
}
