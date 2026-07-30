/**
 * Minimal CSV reader. Pure: takes text, returns rows. File reading lives in
 * scripts/load.ts because src/lib must stay free of fs (spec §14: CSV parsing
 * happens in scripts at build time, never in the browser).
 *
 * The dataset is machine-generated and quote-free, but quoted fields are handled
 * so a comma inside a merchant name can never silently shift a column.
 */

export type CsvRow = Record<string, string>

function splitLine(line: string): string[] {
  const cells: string[] = []
  let cell = ""
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ",") {
      cells.push(cell)
      cell = ""
    } else {
      cell += char
    }
  }
  cells.push(cell)
  return cells
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0)
  const header = lines.shift()
  if (!header) return []
  const columns = splitLine(header).map((c) => c.trim())

  return lines.map((line) => {
    const cells = splitLine(line)
    const row: CsvRow = {}
    columns.forEach((column, index) => {
      row[column] = (cells[index] ?? "").trim()
    })
    return row
  })
}

export function num(row: CsvRow, column: string): number {
  const value = Number(row[column])
  return Number.isFinite(value) ? value : 0
}

export function bool(row: CsvRow, column: string): boolean {
  const value = row[column]
  return value === "1" || value === "true" || value === "True"
}

export function str(row: CsvRow, column: string): string {
  return row[column] ?? ""
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0)
}

export function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : (part / whole) * 100
}
