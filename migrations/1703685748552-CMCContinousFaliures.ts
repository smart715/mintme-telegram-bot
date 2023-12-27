import {MigrationInterface, QueryRunner} from "typeorm";

export class CMCContinousFaliures1703685748552 implements MigrationInterface {
    name = 'CMCContinousFaliures1703685748552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` ADD \`continous_failed\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`blacklist\` ADD UNIQUE INDEX \`IDX_7ccf86cd47469d27d32bffeeea\` (\`content\`)`);
        await queryRunner.query(`ALTER TABLE \`queued_contact\` CHANGE \`is_error\` \`is_error\` tinyint NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`queued_contact\` CHANGE \`is_error\` \`is_error\` tinyint(1) NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`blacklist\` DROP INDEX \`IDX_7ccf86cd47469d27d32bffeeea\``);
        await queryRunner.query(`ALTER TABLE \`coin_market_cap_account\` DROP COLUMN \`continous_failed\``);
    }

}
