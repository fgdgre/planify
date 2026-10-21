// Fills the __NUXT_INLINE_SCRIPT_HASHES__ placeholder in the generated
// `_headers` file with CSP sha256 hashes of every inline <script> found in the
// prerendered HTML.
//
// Why: `nuxt generate` (ssr: false) writes one inline script per page that
// bootstraps `window.__NUXT__.config`. Its content includes the build id, so it
// changes on every build and cannot be hard-coded in public/_headers. Hashing it
// at build time keeps `script-src 'self' 'sha256-…'` strict without
// 'unsafe-inline'.
//
// Wired up from nuxt.config.ts (nitro `prerender:done` hook) and usable by hand:
//   node scripts/csp-inline-hashes.mjs .output/public
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const PLACEHOLDER = '__NUXT_INLINE_SCRIPT_HASHES__'

const INLINE_SCRIPT_RE = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listHtmlFiles(path)))
    } else if (entry.name.endsWith('.html')) {
      files.push(path)
    }
  }

  return files
}

/** Returns the executable inline scripts of one HTML document. */
export function extractInlineScripts(html) {
  const scripts = []

  for (const match of html.matchAll(INLINE_SCRIPT_RE)) {
    const attrs = match[1] ?? ''
    const body = match[2]

    if (/\ssrc\s*=/.test(attrs)) continue
    // Data blocks (application/json, importmap excluded on purpose) never execute.
    if (/\stype\s*=\s*["']?(application\/(ld\+)?json|text\/template)/i.test(attrs)) continue
    if (!body.trim()) continue

    scripts.push(body)
  }

  return scripts
}

export function hashInlineScript(source) {
  return `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`
}

export async function applyInlineScriptHashes(publicDir) {
  const headersPath = join(publicDir, '_headers')
  const headers = await readFile(headersPath, 'utf8')

  if (!headers.includes(PLACEHOLDER)) {
    throw new Error(`[csp] ${headersPath} has no ${PLACEHOLDER} placeholder`)
  }

  const hashes = new Set()

  for (const file of await listHtmlFiles(publicDir)) {
    const html = await readFile(file, 'utf8')
    for (const script of extractInlineScripts(html)) {
      hashes.add(hashInlineScript(script))
    }
  }

  const replacement = [...hashes].join(' ')
  await writeFile(headersPath, headers.replaceAll(PLACEHOLDER, replacement).replace(/[ \t]+$/gm, ''))

  return [...hashes]
}

const isCli = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (isCli) {
  const publicDir = process.argv[2] ?? '.output/public'
  const hashes = await applyInlineScriptHashes(publicDir)
  console.log(`[csp] ${hashes.length} inline script hash(es) written to ${join(publicDir, '_headers')}`)
}
