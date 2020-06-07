import chai from 'chai'

import * as _ from '../lib/_.js'

const nowait = (value) => new Promise(resolve => resolve(value))

export const test_asyncCompose = async () => {
  const asyncGetNumm = async (num) => await nowait(num)
  const asyncIncramentNum = async (v) => await nowait(v + 1)
  
  const fn = _.asyncCompose(asyncGetNumm, asyncIncramentNum)
  const result = await fn(10)
  
  chai.assert.equal(result, 11)
}

export const test_compose = () => {
  const getNumm = (num) => num
  const incramentNum = (v) => v + 1
  
  const fn = _.compose(getNumm, incramentNum)
  const result = fn(10)
  
  chai.assert.equal(result, 11)
}

export const test_sum = () => {
  const nums = [1, 2, 3]
  const expected = 6
  const result = _.sum(nums, n => n)
  
  chai.assert.equal(expected, result)
}

export const test_asyncMap = async () => {
  const asyncIncrament = async (num) => await nowait(num +1)
  
  const nums = [1, 2, 3]
  const result = await _.asyncMap(nums, asyncIncrament)
  
  chai.assert.equal(result[0], 2)
  chai.assert.equal(result[1], 3)
  chai.assert.equal(result[2], 4)
}

export const test_seperate = () => {
  const objects = [{
    size: 'large'
  }, {
    size: 'large'
  }, {
    size: 'small'
  }]

  const [larges, smalls] = _.seperate(objects, o => o.size === 'large')

  chai.assert.equal(larges.length, 2)
  chai.assert.equal(smalls.length, 1)
}

export const test_withIgnoreSkipped = () => {
  const mockFn = (arg) => {
    return { ...arg, changed: true }
  }
  const fn = _.withIgnoreSkipped(mockFn)

  const resultA = fn({ skip: true })
  chai.assert.equal(resultA.changed, undefined)

  const resultB = fn({})
  chai.assert.equal(resultB.changed, true)
}

export const test_withPatternMatch = () => {
  const fn = _.withPatternMatch('test', o => o.name)(arg => arg)
  const result = fn({ name: 'test thing' })

  chai.assert.equal(result.pattern, 'test')
  chai.assert.equal(result.name, 'test thing')
}