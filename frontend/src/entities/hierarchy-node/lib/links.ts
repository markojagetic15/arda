const PAGE_PATH = /^\/workspace\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i

/** The shareable URL of a page. */
export function pageUrl(pageId: string): string {
  return `${window.location.origin}/workspace/${pageId}`
}

/**
 * The page id if `text` is a link to a page in this app (absolute on this
 * origin, or a bare `/workspace/<id>` path), otherwise null.
 */
export function parsePageLink(text: string): string | null {
  const value = text.trim()
  if (!value || /\s/.test(value)) return null
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return null
    return PAGE_PATH.exec(url.pathname)?.[1] ?? null
  } catch {
    return null
  }
}

/** Ids of every page linked in a block of text, in order, without duplicates. */
export function extractPageLinks(text: string): string[] {
  const ids: string[] = []
  for (const match of text.matchAll(/(?:https?:\/\/\S+|\/workspace\/[0-9a-f-]{36})/gi)) {
    const id = parsePageLink(match[0].replace(/[).,;!?]+$/, ''))
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}
