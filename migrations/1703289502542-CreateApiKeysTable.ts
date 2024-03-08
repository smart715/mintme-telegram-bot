import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateApiKeysTable1703289502542 implements MigrationInterface {
    public name = 'CreateApiKeysTable1703289502542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS api_key (
                id INT PRIMARY KEY AUTO_INCREMENT,
                service_id INT,
                api_key VARCHAR(255) NOT NULL,
                next_attempt_date DATETIME,
                disabled BOOLEAN NOT NULL DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (service_id) REFERENCES api_service(id)
            );
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE api_key;`)
    }
}
