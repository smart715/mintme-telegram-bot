import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIsErrorColumn1699478930105 implements MigrationInterface {
    public name = 'AddIsErrorColumn1699478930105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`queued_contact\` ADD COLUMN \`is_error\` BOOLEAN DEFAULT FALSE;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(` ALTER TABLE \`queued_contact\` DROP COLUMN \`is_error\` ; `)
    }
}
