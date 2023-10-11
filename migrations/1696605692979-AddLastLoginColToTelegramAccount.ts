import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLastLoginColToTelegramAccount1696605692979 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`telegram_account\`
            ADD COLUMN \`last_login\` datetime NULL`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`telegram_account\`
            DROP COLUMN \`last_login\``
        )
    }
}
