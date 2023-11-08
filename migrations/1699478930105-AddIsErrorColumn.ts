import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddIsErrorColumn1699478930105 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('queued_contact', new TableColumn({
            name: 'is_error',
            type: 'boolean',
            default: false,
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('queued_contact', 'is_error')
    }
}
