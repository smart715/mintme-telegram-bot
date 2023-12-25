import { MigrationInterface, QueryRunner } from 'typeorm'

export class CMCLastLogin1703423796795 implements MigrationInterface {
    public name = 'CMCLastLogin1703423796795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` ADD \`last_login\` datetime NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` DROP COLUMN \`last_login\``)
    }
}
