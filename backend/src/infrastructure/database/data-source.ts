import 'dotenv/config';

import { DataSource } from 'typeorm';

import configuration from '../config/configuration.js';
import { buildTypeOrmOptions } from './typeorm-options.js';

/**
 * Used by the TypeORM CLI (`npm run migration:*`) - not injected into Nest's DI.
 * The CLI requires exactly one DataSource export, so this is the only one.
 */
export default new DataSource(buildTypeOrmOptions(configuration().database));
