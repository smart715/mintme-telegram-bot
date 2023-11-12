import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUniqueAddressBlockchainToken1699784706832 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`ALTER TABLE \`token\` ADD CONSTRAINT \`unique_blockchain_address\` UNIQUE (\`blockchain\`, \`address\`)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`ALTER TABLE \`token\` DROP CONSTRAINT \`unique_blockchain_address\``)
    }

}
