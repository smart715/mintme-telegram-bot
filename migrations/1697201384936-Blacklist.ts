import { MigrationInterface, QueryRunner } from 'typeorm'

export class Blacklist1697201384936 implements MigrationInterface {
    public name: string = 'Blacklist1697201384936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`blacklist\`
              (
                  \`id\`      int          NOT NULL AUTO_INCREMENT,
                  \`content\` varchar(255) NOT NULL,
                  \`type\`    varchar(255) NOT NULL,
                  PRIMARY KEY (\`id\`),
                  UNIQUE INDEX \`IDX_Unique_Content\` (\`content\`)
              ) ENGINE = InnoDB;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`blacklist\`;`)
    }
}
