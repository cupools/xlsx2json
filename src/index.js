const XLSX = require('xlsx')

const SEP = '__SEP__'

/**
 * convert xlsx to json
 * @param {Buffer} raw - file Buffer
 * @param {string} [name] - sheetName
 * @return {Object} json from xlsx
 */
function xlsx2json(raw, name) {
  const workbook = XLSX.read(raw)
  return workbook.SheetNames
    .filter(sheetName => (sheetName ? name === sheetName : true))
    .reduce(
      (mem, sheetName) => ({ ...mem, [sheetName]: parse(workbook.Sheets[sheetName]) }),
      {}
    )
}

function parse(sheet) {
  const mergesInfo = sheet['!merges']
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: SEP })
  const table = csv.split('\n').slice(0, -1).map(rowstr => rowstr.split(SEP))

  const correct = correctMerges(mergesInfo)
  const get = (col, row) => {
    if (table[row][col] !== '') return table[row][col]

    // try to resolve merged cell
    const possible = correct(col, row)

    if (possible) {
      const { c, r } = possible
      return table[r][c]
    }

    return undefined
  }

  const header = table.slice(0, 1).shift()

  return table
    .map((row, rowIndex) => {
      if (rowIndex === 0) return null
      return row.reduce((mem, val, colIndex) => {
        const value = get(colIndex, rowIndex)
        return { ...mem, [header[colIndex]]: value ? value.trim() : value }
      }, {})
    })
    .slice(1)
}

/**
 * correct the merged cell and get the correct value
 * @param {Object} mergesInfo - declare which cells are merged
 * @return {Function} correct
 */
function correctMerges(mergesInfo) {
  const store = mergesInfo.reduce((mem, item) => {
    const { s, e } = item
    const { c: sc, r: sr } = s
    const { c: ec, r: er } = e

    let c = sc
    let r = sr

    // iterate merged cells and create map
    while (c <= ec) {
      r = sr
      while (r <= er) {
        Object.assign(mem, { [c + ',' + r]: { c: sc, r: sr } })
        r += 1
      }
      c += 1
    }

    return mem
  }, {})

  return (col, raw) => store[col + ',' + raw]
}

module.exports = xlsx2json
