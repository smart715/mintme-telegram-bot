import { MigrationInterface, QueryRunner } from 'typeorm'

export class CMCContinousFaliures1703685748552 implements MigrationInterface {
    public name = 'CMCContinousFaliures1703685748552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` ADD \`continous_failed\` int NOT NULL DEFAULT '0'`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` DROP COLUMN \`continous_failed\``)
    }
}
