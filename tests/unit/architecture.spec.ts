import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const APP = resolve(__dirname, '../../app')
const LAYERS = ['shared', 'entities', 'features', 'widgets'] as const
type Layer = (typeof LAYERS)[number]
const APP_LEVEL = LAYERS.length
const NESTED_SLICE_GROUPS = new Set(['integrations'])
const DEEP_IMPORTS_ALLOWED_IN = ['plugins/']

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g

interface Location {
  layer: number
  slice: string | null
}

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|vue)$/.test(name) && !/\.(spec|test)\.ts$/.test(name) ? [path] : []
  })

const locate = (appRelativePath: string): Location => {
  const [top, ...rest] = appRelativePath.split('/')
  const layer = LAYERS.indexOf(top as Layer)
  if (layer === -1) return { layer: APP_LEVEL, slice: null }
  if (top === 'shared') return { layer, slice: null }
  const group = rest[0] ?? ''
  const slice = NESTED_SLICE_GROUPS.has(group) ? `${group}/${rest[1]}` : group
  return { layer, slice: `${top}/${slice}` }
}

const targetOf = (file: string, specifier: string): { path: string; viaAlias: boolean } | null => {
  const alias = specifier.match(/^@(shared|entities|features|widgets)\/(.+)$/)
  if (alias) return { path: `${alias[1]}/${alias[2]}`, viaAlias: true }
  if (specifier.startsWith('.')) return { path: relative(APP, resolve(dirname(file), specifier)), viaAlias: false }
  return null
}

const violations = () => {
  const found: string[] = []

  for (const file of sourceFiles(APP)) {
    const fromPath = relative(APP, file)
    const from = locate(fromPath)
    const source = readFileSync(file, 'utf8')

    for (const match of source.matchAll(IMPORT_RE)) {
      const specifier = match[1] ?? match[2] ?? match[3]
      if (!specifier) continue
      const target = targetOf(file, specifier)
      if (!target) continue
      const to = locate(target.path)
      if (to.layer === APP_LEVEL) continue

      const where = `${fromPath} imports '${specifier}'`
      const sameSlice = from.slice !== null && from.slice === to.slice

      if (to.layer > from.layer) {
        found.push(`${where}: ${LAYERS[to.layer]} is above ${LAYERS[from.layer] ?? 'app'}`)
        continue
      }

      if (sameSlice || to.slice === null) continue

      if (to.layer === from.layer && (LAYERS[from.layer] === 'features' || LAYERS[from.layer] === 'widgets')) {
        found.push(`${where}: ${LAYERS[from.layer]} must not import each other`)
        continue
      }

      const isBarrel = target.viaAlias && target.path === to.slice
      const deepAllowed = DEEP_IMPORTS_ALLOWED_IN.some((dir) => fromPath.startsWith(dir))
      if (!isBarrel && !deepAllowed) found.push(`${where}: import '@${to.slice}' instead`)
    }
  }

  return found
}

describe('architecture', () => {
  it('imports only go down the layers, never across features or widgets, and enter other slices through their index', () => {
    expect(violations()).toEqual([])
  })
})
