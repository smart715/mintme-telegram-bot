import { MigrationInterface, QueryRunner } from 'typeorm'

export class LastGroupsLeavingDate1719420816634 implements MigrationInterface {
    public name = 'LastGroupsLeavingDate1719420816634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` ADD \`last_groups_leaving_date\` datetime NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`telegram_account\` DROP COLUMN \`last_groups_leaving_date\``)
    }
}
