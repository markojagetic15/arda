import 'dotenv/config';

import { DataSource } from 'typeorm';

import configuration from '../config/configuration.js';
import { buildTypeOrmOptions } from './typeorm-options.js';

/**
 * Used by the TypeORM CLI (`npm run migration:*`) — not injected into Nest's DI.
 */
export const dataSource = new DataSource(
  buildTypeOrmOptions(configuration().database),
);

export default dataSource;
