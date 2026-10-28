import { readLocal, writeLocal } from './local'

const KEY = 'proarda-recent-pages'
const LIMIT = 8

/** Most recently opened page ids, newest first. */
export function getRecentPageIds(): string[] {
  return readLocal<string[]>(KEY, [])
}

export function rememberRecentPage(pageId: string): void {
  writeLocal(KEY, [pageId, ...getRecentPageIds().filter((id) => id !== pageId)].slice(0, LIMIT))
}
