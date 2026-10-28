export abstract class FileStorage {
  /** Stores bytes under `name` (a generated, unique file name). */
  abstract save(name: string, data: Buffer): Promise<void>;
  /** Absolute path of a stored file, or null if it doesn't exist. */
  abstract resolve(name: string): Promise<string | null>;
}
