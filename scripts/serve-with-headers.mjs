// Serves a generated Nuxt site (default `.output/public`) and applies the rules
// of its Netlify `_headers` file to every response, so header-dependent
// behaviour (CSP, framing, CORS for sandboxed iframes) can be tested locally
// and in CI against the real build output.
//
//   node scripts/serve-with-headers.mjs [dir] [port]
//
// Also importable: `startServer({ dir, port })` resolves to `{ server, url }`.
//
// Unknown paths fall back to `200.html` (the SPA shell `nuxt generate` writes
// for ssr:false), like a Netlify `/* /200.html 200` rewrite.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

/**
 * Parses Netlify `_headers` syntax: a path pattern on its own line, followed by
 * indented `Name: value` lines. `*` is a splat. Comments (#) and blanks are skipped.
 * @returns {{ pattern: RegExp, source: string, headers: [string, string][] }[]}
 */
export function parseHeadersFile(text) {
  const rules = []
  let current = null

  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue

    if (!/^\s/.test(line)) {
      const source = line.trim()
      const pattern = new RegExp(`^${source.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)
      current = { pattern, source, headers: [] }
      rules.push(current)
      continue
    }

    const separator = line.indexOf(':')
    if (current && separator > 0) {
      current.headers.push([line.slice(0, separator).trim(), line.slice(separator + 1).trim()])
    }
  }

  return rules
}

/** Headers that apply to `pathname`. Like Netlify, every matching rule applies; later rules win on conflicts. */
export function headersFor(rules, pathname) {
  const result = {}
  for (const rule of rules) {
    if (rule.pattern.test(pathname)) {
      for (const [name, value] of rule.headers) result[name] = value
    }
  }
  return result
}

function resolveFile(root, pathname) {
  const decoded = normalize(decodeURIComponent(pathname))
  const candidates = [join(root, decoded), join(root, decoded, 'index.html'), join(root, `${decoded}.html`)]

  for (const candidate of candidates) {
    if (!candidate.startsWith(root + sep) && candidate !== root) return null
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }

  return null
}

export async function startServer({ dir = '.output/public', port = 0 } = {}) {
  const root = join(process.cwd(), dir)
  const rules = parseHeadersFile(readFileSync(join(root, '_headers'), 'utf8'))
  const shell = join(root, '200.html')

  const server = createServer((req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost')
    const file = resolveFile(root, pathname) ?? (extname(pathname) ? null : shell)

    if (!file || !existsSync(file)) {
      res.writeHead(404, headersFor(rules, pathname)).end('Not found')
      return
    }

    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', ...headersFor(rules, pathname) })
    createReadStream(file).pipe(res)
  })

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve))
  return { server, url: `http://127.0.0.1:${server.address().port}` }
}

const isCli = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (isCli) {
  const { url } = await startServer({ dir: process.argv[2], port: Number(process.argv[3] ?? 4173) })
  console.log(`[serve] ${url}`)
}
