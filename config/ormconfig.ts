import path from 'path'
import config from 'config'
import { ConnectionOptions } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

export default {
    type: 'mariadb',
    host: config.get('db_host'),
    port: 3306,
    username: config.get('db_user'),
    password: config.get('db_password'),
    database: config.get('db_name'),
    entities: [ path.join(__dirname, '../src/**/entity/*') ],
    migrations: [ path.join(__dirname, '../migrations/*') ],
    cli: {
        'migrationsDir': path.join(__dirname, '../migrations'),
        'entitiesDir': path.join(__dirname, '../src/core/entity'),
    },
    namingStrategy: new SnakeNamingStrategy(),
    timezone: '0',
} as ConnectionOptions
