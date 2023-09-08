import { MigrationInterface, QueryRunner } from 'typeorm'

export class PanelTables1694188291014 implements MigrationInterface {
    public name = 'PanelTables1694188291014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`blacklisted_email\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`email\` varchar(512) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`blockchain_stat\` (
                \`blockchain\` varchar(32) NOT NULL,
                \`worker\` varchar(32) NOT NULL,
                \`updated_at\` datetime DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`cached_stat\` (
                \`blockchain\` varchar(8) NOT NULL,
                \`total_responses\` int(11) NOT NULL,
                \`total_fetched\` int(11) NOT NULL,
                \`updated_at\` datetime DEFAULT NULL ON UPDATE current_timestamp()
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`message_template\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`title\` varchar(1024) NOT NULL,
                \`body\` text NOT NULL,
                \`reminder_order\` int(11) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`reminding_history\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`reminding_token_id\` int(11) NOT NULL,
                \`channel\` varchar(255) NOT NULL,
                \`created_at\` datetime NOT NULL DEFAULT current_timestamp(),
                \`message_id\` int(11) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`reminding_token\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`address\` varchar(255) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`post_announcement\` tinyint(1) DEFAULT 0,
                \`add_logo\` tinyint(1) DEFAULT 0,
                \`create_order\` tinyint(1) DEFAULT 0,
                \`is_unsubscribed\` tinyint(1) DEFAULT 0,
                \`unsubscribe_key\` varchar(255) NOT NULL,
                \`previous_reminders_number\` int(11) NOT NULL DEFAULT 0,
                \`added_at\` datetime NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`unsubscribed_email\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`email\` varchar(255) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`user\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`username\` varchar(255) NOT NULL,
                \`password\` varchar(255) NOT NULL,
                \`is_admin\` tinyint(1) DEFAULT 0,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`user_log\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`user_id\` int(11) NOT NULL,
                \`log_text\` text NOT NULL,
                \`data\` text NOT NULL,
                \`created_at\` datetime NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`blacklisted_email\``)
        await queryRunner.query(`DROP TABLE \`blockchain_stat\``)
        await queryRunner.query(`DROP TABLE \`cached_stat\``)
        await queryRunner.query(`DROP TABLE \`message_template\``)
        await queryRunner.query(`DROP TABLE \`reminding_history\``)
        await queryRunner.query(`DROP TABLE \`reminding_token\``)
        await queryRunner.query(`DROP TABLE \`unsubscribed_email\``)
        await queryRunner.query(`DROP TABLE \`user\``)
        await queryRunner.query(`DROP TABLE \`user_log\``)
    }
}
