'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends4 = require('babel-runtime/helpers/extends');

var _extends5 = _interopRequireDefault(_extends4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var XLSX = require('xlsx');

var FS_SEP = '__SEP__';
var RS_SEP = '__RETURN_LINE__';

/**
 * convert xlsx to json
 * @param {Buffer} raw - file Buffer
 * @param {string} [name] - sheetName
 * @return {Object} json from xlsx
 */
function xlsx2json(raw, name) {
  var workbook = XLSX.read(raw);
  var json = workbook.SheetNames.filter(function (sheetName) {
    return name ? name === sheetName : true;
  }).reduce(function (mem, sheetName) {
    return (0, _extends5.default)({}, mem, (0, _defineProperty3.default)({}, sheetName, parse(workbook.Sheets[sheetName])));
  }, {});
  return name ? json[name] : json;
}

function parse(sheet) {
  var mergesInfo = sheet['!merges'];
  var csv = XLSX.utils.sheet_to_csv(sheet, { FS: FS_SEP, RS: RS_SEP });
  var table = csv.split(RS_SEP).slice(0, -1).map(function (rowstr) {
    return rowstr.split(FS_SEP);
  });

  var correct = correctMerges(mergesInfo);
  var get = function get(col, row) {
    if (table[row][col] !== '') return table[row][col];

    // try to resolve merged cell
    var possible = correct(col, row);

    if (possible) {
      var c = possible.c,
          r = possible.r;

      return table[r][c];
    }

    return undefined;
  };

  var header = table.slice(0, 1).shift();

  return table.map(function (row, rowIndex) {
    if (rowIndex === 0) return null;
    return row.reduce(function (mem, val, colIndex) {
      var value = get(colIndex, rowIndex);
      return (0, _extends5.default)({}, mem, (0, _defineProperty3.default)({}, header[colIndex], value ? value.trim() : value));
    }, {});
  }).slice(1);
}

/**
 * correct the merged cell and get the correct value
 * @param {Object} mergesInfo - declare which cells are merged
 * @return {Function} correct
 */
function correctMerges(mergesInfo) {
  var store = (mergesInfo || []).reduce(function (mem, item) {
    var s = item.s,
        e = item.e;
    var sc = s.c,
        sr = s.r;
    var ec = e.c,
        er = e.r;


    var c = sc;
    var r = sr;

    // iterate merged cells and create map
    while (c <= ec) {
      r = sr;
      while (r <= er) {
        (0, _assign2.default)(mem, (0, _defineProperty3.default)({}, c + ',' + r, { c: sc, r: sr }));
        r += 1;
      }
      c += 1;
    }

    return mem;
  }, {});

  return function (col, raw) {
    return store[col + ',' + raw];
  };
}

module.exports = xlsx2json;