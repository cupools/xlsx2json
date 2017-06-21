/* eslint-env mocha */
const fs = require('fs')
const Chai = require('chai')
const xlsx4conf = require('../src/index')

Chai.should()

describe('index', () => {
  it('should work', () => {
    const buffer = fs.readFileSync('test/fixtures/raw.xlsx')
    const list = xlsx4conf(buffer)

    list.should.have.property('download')
  })

  it('should work', () => {
    const buffer = fs.readFileSync('test/fixtures/raw.xlsx')
    const list = xlsx4conf(buffer, 'download')

    list.should.be.lengthOf(7)
  })
})
