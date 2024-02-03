import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateApiKeysTable1703289502542 implements MigrationInterface {
    public name = 'CreateApiKeysTable1703289502542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS api_key (
                id INT PRIMARY KEY AUTO_INCREMENT,
                serviceId INT,
                api_key VARCHAR(255) NOT NULL,
                next_attempt_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (serviceId) REFERENCES api_service(id)
            );
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE api_key;`)
    }
}
