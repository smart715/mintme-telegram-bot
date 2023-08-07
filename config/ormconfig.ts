import path from 'path'
import { ConnectionOptions } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

export default {
    type: 'mariadb',
    host: process.env.DB_HOST,
    port: 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [ path.join(__dirname, '../src/**/entity/*') ],
    migrations: [ path.join(__dirname, '../migrations/*') ],
    cli: {
        'migrationsDir': path.join(__dirname, '../migrations'),
        'entitiesDir': path.join(__dirname, '../src/core/entity'),
    },
    namingStrategy: new SnakeNamingStrategy(),
    timezone: '0',
    charset: 'utf8mb4',
} as ConnectionOptions
