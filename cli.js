#!/usr/bin/env node

import parse from 'minimist'
import pathlib from 'path'

import { createLogger, logResults } from './lib/logging.js'
import { collect } from './lib/collect.js'
import { runCollectedTests } from './lib/execute.js'
import { aggregate } from './lib/aggregate.js'


const withCliArgs = (fn) => async () => await fn(parse(process.argv.slice(2)))

const withExitProcess = (fn) => async (...args) => {
  try { await fn(...args) && process.exit(0) } catch (err) { console.error(err) && process.exit(1) }
}

const withThrowIfFailed = (fn) => async (...args) => {
  const { stats } = await fn(...args)
  if (stats.failedCount > 0) throw `Inforcer tests failed with ${stats.failedCount} failures`
}

const start = async ({
  targetPath = './src',
  testFileRegex = ".*\.test\.js",
  testFnRegex = "^test.*",
  level = 'default', // silent, error, default, verbose, debug
  ignores = [ 'node_modules' ]
}) => {

  const logger = createLogger(level)

  const target = pathlib.join(process.cwd(), targetPath)
  logger.info(`Searching for tests at ${target}`)

  // Collect tests
  const collectedTests = await collect(target, testFileRegex, testFnRegex, ignores)

  // Run tests
  const results = await runCollectedTests(collectedTests)

  // Process test results    
  const aggregated = await aggregate(results)

  // Print results
  logResults(logger, aggregated)

  return aggregated

}

withExitProcess(
  withThrowIfFailed(
    withCliArgs(start)))()