import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialState1689246380860 implements MigrationInterface {
    public name = 'InitialState1689246380860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`token\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`address\` varchar(80) NOT NULL,
                \`blockchain\` varchar(32) NOT NULL,
                \`name\` varchar(255) NULL,
                \`emails\` text NULL,
                \`websites\` text NULL,
                \`links\` text NULL,
                \`avoid_contacting\` tinyint NOT NULL DEFAULT 0,
                \`last_contact_attempt\` datetime NULL,
                \`last_contact_method\` varchar(32) NULL,
                \`email_attempts\` int(4) NOT NULL DEFAULT '0',
                \`twitter_attempts\` int(4) NOT NULL DEFAULT '0',
                \`telegram_attempts\` int(4) NOT NULL DEFAULT '0',
                \`duplicated_times\` int(4) NOT NULL DEFAULT '0',
                \`source\` varchar(64) NULL,
                \`is_added_to_sheet\` tinyint NOT NULL DEFAULT 0,
                \`contact_status\` varchar(32) NOT NULL DEFAULT 'NOT_CONTACTED',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`last_tx_date\` datetime NULL,
                UNIQUE INDEX \`UQ_ADDRESS_BLOCKCHAIN\` (\`address\`, \`blockchain\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
        await queryRunner.query(`
            CREATE TABLE \`contact_history\` (
                 \`id\` int NOT NULL AUTO_INCREMENT,
                 \`address\` varchar(80) NOT NULL,
                 \`blockchain\` varchar(32) NOT NULL,
                 \`contact_method\` varchar(64) NOT NULL,
                 \`is_success\` tinyint NOT NULL DEFAULT 0,
                 \`channel\` varchar(512) NULL,
                 \`message_id\` int NULL,
                 \`status\` varchar(32) NULL,
                 \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                 INDEX \`IDX_ADDRESS_BLOCKCHAIN\` (\`address\`, \`blockchain\`),
                 PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
        await queryRunner.query(`
            CREATE TABLE \`queued_contact\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`address\` varchar(80) NOT NULL,
                \`blockchain\` varchar(32) NOT NULL,
                \`channel\` varchar(512) NOT NULL,
                \`is_planned\` tinyint NOT NULL DEFAULT 0,
                \`is_processing\` tinyint NOT NULL DEFAULT 0,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`UQ_ADDRESS_BLOCKCHAIN\` (\`address\`, \`blockchain\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
        await queryRunner.query(`
            CREATE TABLE \`contact_message\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`title\` varchar(512) NOT NULL,
                \`content\` text NOT NULL,
                \`is_tg_only\` tinyint NOT NULL DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`contact_message\``)
        await queryRunner.query(`DROP TABLE \`queued_contact\``)
        await queryRunner.query(`DROP TABLE \`contact_history\``)
        await queryRunner.query(`DROP TABLE \`token\``)
    }
}
