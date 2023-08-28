import { MigrationInterface, QueryRunner } from 'typeorm'

export class EmailWorker1691910782237 implements MigrationInterface {
    public name = 'EmailWorker1691910782237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`contact_message\`
            ADD \`attempt\` int NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`contact_message\` DROP COLUMN \`attempt\`
        `)
    }
}
