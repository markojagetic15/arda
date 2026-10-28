import path from 'node:path';

import type { DataSourceOptions } from 'typeorm';

import type { AppConfig } from '../config/configuration.js';

export function buildTypeOrmOptions(
  database: AppConfig['database'],
): DataSourceOptions {
  return {
    type: 'postgres',
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: database.database,
    entities: [
      path.join(import.meta.dirname, '..', '..', '**', '*.entity.{js,ts}'),
    ],
    migrations: [path.join(import.meta.dirname, 'migrations', '*.{js,ts}')],
    synchronize: false,
  };
}
