export interface ImageType {
  mime: string;
  ext: 'png' | 'jpg' | 'gif' | 'webp';
}

/**
 * Detects the image format from the file's first bytes - the declared MIME
 * type and file name are client-controlled and not trusted. SVG is
 * deliberately unsupported: it can carry scripts.
 */
export function detectImageType(data: Buffer): ImageType | null {
  if (data.length < 12) return null;
  if (
    data
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  const head = data.subarray(0, 6).toString('ascii');
  if (head === 'GIF87a' || head === 'GIF89a') {
    return { mime: 'image/gif', ext: 'gif' };
  }
  if (
    data.subarray(0, 4).toString('ascii') === 'RIFF' &&
    data.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

export const IMAGE_MIME_BY_EXT: Record<ImageType['ext'], string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

/** Names produced by the upload use case: `<uuid>.<ext>`. */
export const STORED_IMAGE_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|gif|webp)$/;
