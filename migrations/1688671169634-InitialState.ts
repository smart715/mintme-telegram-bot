import {MigrationInterface, QueryRunner} from 'typeorm';

export class InitialState1688671169634 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`token\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`address\` varchar(80) NOT NULL,
                \`blockchain\` varchar(32) NOT NULL,
                \`name\` varchar(255) DEFAULT NULL,
                \`emails\` varchar(1024) DEFAULT NULL,
                \`websites\` varchar(1024) DEFAULT NULL,
                \`links\` varchar(2048) DEFAULT NULL,
                \`avoid_contacting\` tinyint(1) DEFAULT 0,
                \`last_contact_attempt\` datetime DEFAULT NULL,
                \`last_contact_method\` varchar(32) DEFAULT NULL,
                \`email_attempts\` tinyint(4) DEFAULT 0,
                \`twitter_attempts\` tinyint(4) DEFAULT 0,
                \`telegram_attempts\` tinyint(4) DEFAULT 0,
                \`duplicate_times\` tinyint(4) DEFAULT 0,
                \`source\` varchar(64) NOT NULL,
                \`is_added_to_sheet\` tinyint(1) DEFAULT 0,
                \`contact_status\` varchar(32) DEFAULT "NOT_CONTACTED",
                \`created_at\` datetime NOT NULL DEFAULT current_timestamp(),
                \`updated_at\` datetime DEFAULT current_timestamp(),
                \`last_tx_date\` datetime DEFAULT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_ADDRESS_BLOCKCHAIN\` (\`address\`,\`blockchain\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        await queryRunner.query(`
            CREATE TABLE \`contact_history\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`address\` varchar(80) NOT NULL,
                \`blockchain\` varchar(32) NOT NULL,
                \`contact_method\` varchar(64) NOT NULL,
                \`is_success\` tinyint(1) DEFAULT 0,
                \`message_id\` int(11) DEFAULT NULL,
                \`channel\` varchar(512) DEFAULT NULL,
                \`status\` varchar(32) DEFAULT NULL,
                \`created_at\` datetime NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_ADDRESS_BLOCKCHAIN\` (\`address\`,\`blockchain\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        await queryRunner.query(`
            CREATE TABLE \`queued_contact\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`address\` varchar(80) NOT NULL,
                \`blockchain\` varchar(32) NOT NULL,
                \`channel\` varchar(512) NOT NULL,
                \`is_planned\` tinyint(1) DEFAULT 0,
                \`is_processing\` tinyint(1) DEFAULT 0,
                \`created_at\` datetime NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_ADDRESS_BLOCKCHAIN\` (\`address\`,\`blockchain\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        await queryRunner.query(`
            CREATE TABLE \`channel_status\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`address\` varchar(80) NOT NULL,
                \`blockchain\` varchar(32) NOT NULL,
                \`channel\` varchar(512) NOT NULL,
                \`attempts_amount\` tinyint(4) DEFAULT 0,
                \`status\` varchar(32) NOT NULL,
                \`created_at\` datetime NOT NULL DEFAULT current_timestamp(),
                \`last_attempt\` datetime NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`UQ_ADDRESS_BLOCKCHAIN_CHANNEL\` (\`address\`,\`blockchain\`,\`channel\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)

        await queryRunner.query(`
            CREATE TABLE \`contact_message\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`title\` varchar(512) NOT NULL,
                \`content\` longtext NOT NULL,
                \`allowed_blockchains\` varchar(256) DEFAULT NULL,
                \`is_tg_only\` tinyint(1) DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`token\``)
        await queryRunner.query(`DROP TABLE \`contact_history\``)
        await queryRunner.query(`DROP TABLE \`queued_contact\``)
        await queryRunner.query(`DROP TABLE \`channel_status\``)
        await queryRunner.query(`DROP TABLE \`contact_message\``)
    }

}
