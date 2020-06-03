
import { sum, seperate, compose, withIgnoreSkipped } from './_.js'


export const aggregateTotalStats = (results) => {
    
  const executedTests = results.filter(t => !t.skip)
  const passedCount = sum(executedTests, t => t.passedCount)
  const failedCount = sum(executedTests, t => t.failedCount)
  const totalCount = passedCount + failedCount

  return {
    results,
    stats: {
      passedCount,
      failedCount,
      totalCount,
      passPercentage: passedCount / totalCount
    }
  }
}

export const aggregateResultStats = (results) => results.map(withIgnoreSkipped((result) => {
  const executedTests = result.tests.filter(t => !t.skip)
  const [passed, failed] = seperate(executedTests, r => r.passed)
  return {
    ...result,
    totalCount: executedTests.length,
    passedCount: passed.length,
    failedCount: failed.length,
    passPercentage: passed.length / result.tests.length
  }
}))

export const aggregate = compose(
  aggregateResultStats,
  aggregateTotalStats)