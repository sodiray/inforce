import chai from 'chai'

import { aggregateTotalStats, aggregateResultStats } from '../lib/aggregate.js'


export const test_aggregateTotalStats = () => {
  const mockTestResults = [{
    skip: true   
  }, {
    skip: false,
    passedCount: 2,
    failedCount: 2
  }, {
    passedCount: 2,
    failedCount: 2
  }]
  
  const result = aggregateTotalStats(mockTestResults)
  
  chai.assert.equal(result.stats.passedCount, 4)
  chai.assert.equal(result.stats.failedCount, 4)
  chai.assert.equal(result.stats.passPercentage, .50)
}

export const test_aggregateResultStats = () => {
  const mockResults = [{
    skip: true
  }, {
    tests: [{
      skip: true
    }, {
      passed: true
    }, {
      passed: false
    }]
  }]

  const result = aggregateResultStats(mockResults)

  chai.assert(result[1].totalCount, 2)
  chai.assert(result[1].passedCount, 1)
  chai.assert(result[1].failedCount, 1)

}