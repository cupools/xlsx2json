## xlsx2json

Convert XLSX to JSON and works well with merged cells.

## Getting started

```bash
$ npm i -S xlsx2json
```

```js
const fs = require('fs')
const xlsx2json = require('xlsx2json')

const workbook = fs.readFileSync('./test/fixtures/raw.xlsx')
const json = xlsx2json(workbook, 'sheetName')

console.log(json)
```
## Test

```bash
$ npm i && npm test
```

