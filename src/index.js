const XLSX = require('xlsx')

const FS_SEP = '__SEP__'
const RS_SEP = '__RETURN_LINE__'

/**
 * convert xlsx to json
 * @param {Buffer} raw - file Buffer
 * @param {string} [name] - sheetName
 * @return {Object} json from xlsx
 */
function xlsx2json(raw, name) {
  const workbook = XLSX.read(raw)
  const json = workbook.SheetNames
    .filter(sheetName => (name ? name === sheetName : true))
    .reduce(
      (mem, sheetName) => ({ ...mem, [sheetName]: parse(workbook.Sheets[sheetName]) }),
      {}
    )
  return name ? json[name] : json
}

function parse(sheet) {
  const mergesInfo = sheet['!merges']
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: FS_SEP, RS: RS_SEP })
  const table = csv.split(RS_SEP).slice(0, -1).map(rowstr => rowstr.split(FS_SEP))

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
  const store = (mergesInfo || []).reduce((mem, item) => {
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
