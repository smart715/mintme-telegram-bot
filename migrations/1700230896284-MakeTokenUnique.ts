import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeTokenUnique1700230896284 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE token DROP INDEX UQ_ADDRESS_BLOCKCHAIN`)
        await queryRunner.query(`ALTER TABLE token ADD CONSTRAINT UQ_token_address UNIQUE (address)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE token DROP INDEX UQ_token_address`)
        await queryRunner.query(`ALTER TABLE token Add UNIQUE index UQ_ADDRESS_BLOCKCHAIN (blockchain, address)`)
    }
}
