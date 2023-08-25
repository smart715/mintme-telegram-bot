import { MigrationInterface, QueryRunner } from 'typeorm'

export class NewestCheckedToken1690280634350 implements MigrationInterface {
    public name = 'NewestCheckedToken1690280634350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`newest_checked_token\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`worker_name\` varchar(255) NOT NULL,
                \`token_id\` varchar(255) NOT NULL,
                \`blockchain\` varchar (32) NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`newest_checked_token\``)
    }
}
