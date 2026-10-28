export class UnsupportedFileError extends Error {
  constructor(message = 'Only PNG, JPEG, GIF and WebP images can be uploaded') {
    super(message);
    this.name = 'UnsupportedFileError';
  }
}
