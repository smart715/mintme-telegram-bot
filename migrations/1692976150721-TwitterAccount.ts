import { MigrationInterface, QueryRunner } from 'typeorm'

export class TwitterAccount1692976150721 implements MigrationInterface {
    public name = 'TwitterAccount1692976150721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`twitter_account\`
            (
                \`id\`                 int          NOT NULL AUTO_INCREMENT,
                \`user_name\`          varchar(255) NOT NULL,
                \`assigned_server_ip\` varchar(255) NULL,
                \`cookies\`            text         NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`twitter_account\``)
    }
}
