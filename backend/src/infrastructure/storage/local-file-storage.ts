import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileStorage } from '../../domain/storage/file-storage.port.js';

/** Files on local disk under UPLOAD_DIR (a bind mount in production, included in backups). */
@Injectable()
export class LocalFileStorage extends FileStorage {
  private readonly root: string;

  constructor(configService: ConfigService) {
    super();
    this.root = path.resolve(configService.getOrThrow<string>('uploadDir'));
  }

  async save(name: string, data: Buffer): Promise<void> {
    await mkdir(this.root, { recursive: true });
    await writeFile(this.target(name), data, { flag: 'wx' });
  }

  async resolve(name: string): Promise<string | null> {
    const target = this.target(name);
    try {
      await access(target);
      return target;
    } catch {
      return null;
    }
  }

  private target(name: string): string {
    const target = path.join(this.root, path.basename(name));
    if (!target.startsWith(this.root + path.sep))
      throw new Error('Invalid file name');
    return target;
  }
}
