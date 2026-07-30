import { readFileSync } from "fs"
import path from "path"

const cache = new Map<string, Record<string, string>[]>()

const parseCsvLine = (line: string): string[] => {
  return line.split(",")
}

export const readCsv = (filename: string): Record<string, string>[] => {
  const cached = cache.get(filename)
  if (cached) {
    return cached
  }

  const filePath = path.join(process.cwd(), "data", filename)
  const raw = readFileSync(filePath, "utf8")
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    cache.set(filename, [])
    return []
  }

  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ""
    })
    return row
  })

  cache.set(filename, rows)
  return rows
}

export const toNumber = (value: string): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
