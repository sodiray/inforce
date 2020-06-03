import pathlib from 'path'

import { createLogger, logResults } from './logging.js'
import { collect } from './collect.js'
import { runCollectedTests } from './execute.js'
import { aggregate } from './aggregate.js'


export default async function run({
  targetPath = './src',
  testFileRegex = ".*\.test\.js",
  testFnRegex = "^test.*",
  level = 'default' // silent, error, default, verbose, debug
}) {

  const logger = createLogger(level)

  const target = pathlib.join(process.cwd(), targetPath)
  logger.info(`Searching for tests at ${target}`)

  // Collect tests
  const collectedTests = await collect(target, testFileRegex, testFnRegex)

  // Run tests
  const results = await runCollectedTests(collectedTests)

  // Process test results    
  const aggregated = await aggregate(results)

  // Print results
  logResults(logger, aggregated)

  if (aggregated.stats.failedCount > 0) throw `Inforcer tests failed with ${aggregated.stats.failedCount} failures`

}