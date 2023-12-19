import { MigrationInterface, QueryRunner } from 'typeorm'

export class CMCCommentingWorker21702893625847 implements MigrationInterface {
    public name = 'CMCCommentingWorker21702893625847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` ADD \`local_storage_json\` text NOT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` DROP COLUMN \`local_storage_json\``)
    }
}
