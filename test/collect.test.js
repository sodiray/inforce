import chai from 'chai'

import { skip, collect } from '../lib/collect.js'

export const test_skip = () => {
  const result = skip({}, 'mock-skip-type')
  chai.assert.equal(result.skip, true)
  chai.assert.equal(result.skipType, 'mock-skip-type')
}

export const test_collect = async () => {
  const result = await collect(`${process.cwd()}/test/test_modules`, '', '', ['ignored'])
  const [dotestFile, donttestFile] = result
  chai.assert.equal(dotestFile.filename, 'do.test.js')
  chai.assert.equal(donttestFile.filename, 'donttest.js')
  chai.assert.equal(dotestFile.module.notAFunction, 22)
}