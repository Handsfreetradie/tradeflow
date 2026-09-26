import Papa from 'papaparse'

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data
        if (data.length === 0) {
          resolve({ headers: [], rows: [] })
          return
        }
        resolve({ headers: data[0], rows: data.slice(1) })
      },
      error: (error) => reject(error),
    })
  })
}
