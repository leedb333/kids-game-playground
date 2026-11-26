import { pictureFiles, type Picture } from './catalog'
import { parseData, type Data, type Side } from './model'

export type LoadedPicture = {
  data: Data; urls: Record<Side, string>; persist?: () => Promise<void>; release?: () => void
}
export const pictureCacheName = (scope: string) => 'kids-playground-' + scope + '-spot-pictures-v1'

export async function loadPicture(picture: Picture, base: string, signal: AbortSignal, refresh = false): Promise<LoadedPicture> {
  const files = pictureFiles(picture.id)
  const request = async (url: string) => {
    const response = await fetch(url, { signal, cache: refresh ? 'reload' : 'default' })
    if (!response.ok) throw new Error('Picture file unavailable')
    return response
  }

  if (picture.offline) {
    const response = await request(base + files.data)
    return { data: parseData(await response.json(), picture),
      urls: { original: base + files.original, modified: base + files.modified } }
  }

  const scope = new URL(base, location.href).href
  const paths = [files.data, files.original, files.modified]
  const keys = paths.map(path => {
    const url = new URL(path, scope)
    url.searchParams.set('v', picture.version)
    return url.href
  })
  // An unavailable Cache Storage must not prevent online play.
  const cache = await globalThis.caches?.open(pictureCacheName(scope)).catch(() => undefined)
  const stored = await Promise.all(keys.map(async key => refresh ? undefined : cache?.match(key).catch(() => undefined)))
  if (!navigator.onLine && stored.some(response => !response)) throw new Error('Picture is not cached')
  const blobs = await Promise.all(keys.map(async (key, i) => (stored[i] ?? await request(key)).blob()))
  const data = parseData(JSON.parse(await blobs[0].text()), picture)
  signal.throwIfAborted()
  const urls = { original: URL.createObjectURL(blobs[1]), modified: URL.createObjectURL(blobs[2]) }
  const release = () => Object.values(urls).forEach(url => URL.revokeObjectURL(url))
  return {
    data, urls, release,
    persist: cache && stored.some(response => !response) ? async () => {
      try {
        // Commit only after both images decode. Keep the other pictures and apps intact.
        await Promise.all(keys.map((key, i) => stored[i] ? undefined : cache.put(key,
          new Response(blobs[i], { headers: { 'Content-Type': blobs[i].type } }))))
        const current = new Set(keys)
        const sameFiles = new Set(keys.map(key => new URL(key).pathname))
        const stale = (await cache.keys()).filter(entry =>
          sameFiles.has(new URL(entry.url).pathname) && !current.has(entry.url))
        await Promise.all(stale.map(entry => cache.delete(entry)))
      } catch { /* Storage may be full or disabled. Online play remains available. */ }
    } : undefined,
  }
}
