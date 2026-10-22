/**
 * A tiny in-memory stand-in for the PostgREST query builder, covering exactly
 * the calls the app makes. Semantics follow PostgREST so feature code behaves
 * the same against it: filters AND together, results are copies, `single()`
 * fails with PGRST116 unless exactly one row matches.
 */
export type Row = Record<string, any>

export type FakeTable = {
  /** Column that identifies a row; what `upsert` conflicts on by default. */
  primaryKey: string
  /** Column values the database would fill in for a new row. Caller values win. */
  defaults: () => Row
  rows: Row[]
}

export type FakeError = { message: string; code: string; details: string | null; hint: string | null }
export type FakeResult = { data: unknown; error: FakeError | null; count?: number | null }

type Operation = 'select' | 'insert' | 'update' | 'upsert' | 'delete'
type Predicate = (row: Row) => boolean
type Cardinality = 'many' | 'single' | 'maybe'

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T/

const clone = <T>(value: T): T => structuredClone(value)

const fail = (message: string, code: string): FakeResult => ({
  data: null,
  error: { message, code, details: null, hint: null },
})

/** Timestamps compare by instant (as timestamptz does), everything else by value. null sorts last. */
function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1

  if (typeof a === 'string' && typeof b === 'string' && ISO_TIMESTAMP.test(a) && ISO_TIMESTAMP.test(b)) {
    return Date.parse(a) - Date.parse(b)
  }

  return (a as any) < (b as any) ? -1 : 1
}

/** SQL ILIKE: `%` matches any run of characters, `_` one character, case-insensitive, whole value. */
function matchesIlike(value: unknown, pattern: string): boolean {
  if (typeof value !== 'string') return false

  const source = pattern
    .split('')
    .map((char) => (char === '%' ? '.*' : char === '_' ? '.' : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('')

  return new RegExp(`^${source}$`, 'is').test(value)
}

/**
 * Parses the `or()` filter string, e.g. `title.ilike.%x%,content_text.ilike.%x%`.
 * Only `ilike` is supported (all the app uses). Splitting happens before each
 * `column.ilike.` so a comma typed into the search term stays part of it.
 */
function parseOrFilter(filter: string): Predicate {
  const conditions = filter.split(/,(?=[a-z_]+\.ilike\.)/).map((part) => {
    const match = /^([a-z_]+)\.ilike\.(.*)$/s.exec(part)
    if (!match) throw new Error(`Fake database: unsupported or() condition "${part}"`)
    return { column: match[1]!, pattern: match[2]! }
  })

  return (row) => conditions.some(({ column, pattern }) => matchesIlike(row[column], pattern))
}

function project(row: Row, columns: string): Row {
  if (columns.trim() === '*') return row

  const picked: Row = {}
  for (const column of columns.split(',').map((c) => c.trim())) {
    picked[column] = row[column]
  }
  return picked
}

export class FakeQueryBuilder implements PromiseLike<FakeResult> {
  private operation: Operation = 'select'
  private payload: Row[] = []
  private conflictColumns: string[]
  private predicates: Predicate[] = []
  private columns = '*'
  private returnsRows = true
  private countsRows = false
  private orderings: Array<{ column: string; ascending: boolean }> = []
  private window: { from: number; to: number } | null = null
  private cardinality: Cardinality = 'many'

  constructor(private readonly table: FakeTable) {
    this.conflictColumns = [table.primaryKey]
  }

  select(columns = '*', options: { count?: 'exact' } = {}): this {
    this.columns = columns
    this.returnsRows = true
    this.countsRows = options.count === 'exact'
    return this
  }

  insert(values: Row | Row[]): this {
    this.operation = 'insert'
    this.payload = Array.isArray(values) ? values : [values]
    this.returnsRows = false
    return this
  }

  update(patch: Row): this {
    this.operation = 'update'
    this.payload = [patch]
    this.returnsRows = false
    return this
  }

  upsert(values: Row | Row[], options: { onConflict?: string } = {}): this {
    this.operation = 'upsert'
    this.payload = Array.isArray(values) ? values : [values]
    this.returnsRows = false
    if (options.onConflict) {
      this.conflictColumns = options.onConflict.split(',').map((c) => c.trim())
    }
    return this
  }

  delete(): this {
    this.operation = 'delete'
    this.returnsRows = false
    return this
  }

  eq(column: string, value: unknown): this {
    return this.where((row) => row[column] === value)
  }

  in(column: string, values: readonly unknown[]): this {
    return this.where((row) => values.includes(row[column]))
  }

  gte(column: string, value: unknown): this {
    return this.where((row) => row[column] != null && compareValues(row[column], value) >= 0)
  }

  lte(column: string, value: unknown): this {
    return this.where((row) => row[column] != null && compareValues(row[column], value) <= 0)
  }

  is(column: string, value: null): this {
    return this.where((row) => (row[column] ?? null) === value)
  }

  not(column: string, operator: 'is', value: null): this {
    if (operator !== 'is') throw new Error(`Fake database: unsupported not() operator "${operator}"`)
    return this.where((row) => (row[column] ?? null) !== value)
  }

  or(filter: string): this {
    return this.where(parseOrFilter(filter))
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    this.orderings.push({ column, ascending: options.ascending ?? true })
    return this
  }

  /** Inclusive on both ends, like PostgREST. */
  range(from: number, to: number): this {
    this.window = { from, to }
    return this
  }

  single(): this {
    this.cardinality = 'single'
    return this
  }

  maybeSingle(): this {
    this.cardinality = 'maybe'
    return this
  }

  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected)
  }

  private where(predicate: Predicate): this {
    this.predicates.push(predicate)
    return this
  }

  private matching(): Row[] {
    return this.table.rows.filter((row) => this.predicates.every((predicate) => predicate(row)))
  }

  private execute(): FakeResult {
    const affected = this.apply()

    if (!this.returnsRows) return { data: null, error: null }

    return this.shape(affected)
  }

  /** Runs the write (if any) and returns the rows the statement acted on. */
  private apply(): Row[] {
    switch (this.operation) {
      case 'select':
        return this.matching()
      case 'insert':
        return this.payload.map((values) => this.insertRow(values))
      case 'update': {
        const rows = this.matching()
        rows.forEach((row) => Object.assign(row, clone(this.payload[0])))
        return rows
      }
      case 'upsert':
        return this.payload.map((values) => this.upsertRow(values))
      case 'delete': {
        const rows = this.matching()
        this.table.rows = this.table.rows.filter((row) => !rows.includes(row))
        return rows
      }
    }
  }

  private insertRow(values: Row): Row {
    const row = { ...this.table.defaults(), ...clone(values) }
    this.table.rows.push(row)
    return row
  }

  private upsertRow(values: Row): Row {
    const existing = this.table.rows.find((row) => this.conflictColumns.every((column) => row[column] === values[column]))

    if (!existing) return this.insertRow(values)

    return Object.assign(existing, clone(values))
  }

  private shape(affected: Row[]): FakeResult {
    const total = affected.length
    let rows = [...affected]

    for (const { column, ascending } of [...this.orderings].reverse()) {
      rows.sort((a, b) => (ascending ? 1 : -1) * compareValues(a[column], b[column]))
    }

    if (this.window) rows = rows.slice(this.window.from, this.window.to + 1)

    const result = rows.map((row) => clone(project(row, this.columns)))
    const count = this.countsRows ? total : undefined

    if (this.cardinality === 'many') return { data: result, error: null, ...(count !== undefined ? { count } : {}) }

    if (result.length === 0 && this.cardinality === 'maybe') return { data: null, error: null }

    if (result.length !== 1) {
      return fail('JSON object requested, multiple (or no) rows returned', 'PGRST116')
    }

    return { data: result[0], error: null }
  }
}
