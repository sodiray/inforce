// built ins
import pathlib from 'path'
import util from 'util'

// dependencies
import fse from 'fs-extra'
import chalk from 'chalk'


export const run = async ({
  targetPath = './src',
  testFileRegex = ".*\.test\.js",
  testFnRegex = "^test.*",
  level = 'default' // silent, error, default, verbose, debug
}) => {

  const logger = createLogger(level)

  const target = pathlib.join(process.cwd(), targetPath)
  logger.info(`Searching for tests at ${target}`)

  const filePaths = await collectAllFilesUnderPath(target)()

  const processFile = asyncCompose(
    skipFileNotMatchingPattern(testFileRegex),
    loadFileModule,
    forEachTestFileExport(compose(
      skipExportNotFunction,
      skipExportNotMatchingPattern(testFnRegex))))

  const collectedTests = await asyncMap(filePaths, processFile)

  // Run Tests
  const results = await runCollectedTests(collectedTests)

  // Process Results
  const aggregate = compose(
    aggregateResultStats,
    aggregateTotalStats)
    
  const aggregated = await aggregate(results)

  logResults(logger, aggregated)

  if (aggregated.stats.failedCount > 0) throw 'Failed test'
}


/***********************
* TEST UTILITY FUNCTIONS 
************************/

const asyncCompose = (...funcs) => (...args) => funcs.slice(1).reduce((chain, fn) => chain.then(fn), Promise.resolve(funcs[0](...args)))
const compose = (...funcs) => (...args) => funcs.slice(1).reduce((acc, fn) => fn(acc), funcs[0](...args))
const sum = (list, getter) => list.reduce((a, b) => a + getter(b), 0)
const asyncMap = async (list, mapFn) => await Promise.all(list.map(mapFn))

const skip = (obj, skipType) => ({ ...obj, skipType, skip: true })
const withIgnoreSkipped = (fn) => (arg) => !!arg.skip ? arg : fn(arg)
const withPatternMatch = (pattern, getter) => (fn) => (arg) => fn({ ...arg, pattern, match: getter(arg).match(pattern) })

const seperate = (list, condition) => list.reduce((acc, next) => {
  const [pass, fail] = acc
  if (condition(next)) return [ [...pass, next ], fail]
  return [pass, [...fail, next]]
}, [ [/** passed **/], [/** failed **/] ])

const forEachTestFileExport = (fn) => withIgnoreSkipped(async (testFile) => ({
  ...testFile,
  tests: Object.entries(testFile.module).map((entry) => {
    const [key, value] = entry
    return fn(key, value)
  })
}))

/**********  END TEST UTILITIES  **********/


/**************************
* TEST COLLECTION FUNCTIONS 
***************************/

const collectAllFilesUnderPath = (path) => async () => {
  const stat = await fse.stat(path)
  if (!stat.isDirectory()) return [{ path, filename: pathlib.basename(path) }]
  const dir = await fse.readdir(path)
  const results = await asyncMap(dir, file => collectAllFilesUnderPath(`${path}/${file}`)())
  return results.flat(1)
}

const loadFileModule = withIgnoreSkipped(async (testFile) => ({
  ...testFile, 
  module: await import(testFile.path)
}))

const skipExportNotFunction = (name, fn) => typeof fn === 'function'  ? { fn, name } : skip({}, 'export-type')

const skipOrKeepExported = (exported) => !exported.match ? skip(exported, 'function-name') : exported
const skipExportNotMatchingPattern = (pattern) => withIgnoreSkipped(withPatternMatch(pattern, a => a.name)(skipOrKeepExported))

const skipOrKeepFile = async (file) => !file.match ? skip(file, 'file-name') : file
const skipFileNotMatchingPattern = (pattern) => withPatternMatch(pattern, a => a.filename)(skipOrKeepFile)

/**********  END TEST COLLECTION  **********/


/*************************
* TEST EXECUTION FUNCTIONS 
**************************/

const executeTest = async (test) => {
  try {
    await test.fn()
  } catch (error) {
    return {
      ...test,
      error,
      passed: false
    }
  }
  return {
    ...test,
    passed: true
  }
}

const runCollectedTests = async (collectedTests) => {
  return await asyncMap(collectedTests, withIgnoreSkipped(async (testFile) => {
    return {
      ...testFile,
      tests: await asyncMap(testFile.tests, withIgnoreSkipped(async (test) => {
        return await executeTest(test)
      }))
    }
  }))
}

/**********  END TEST EXECUTION  **********/


/**************************
* TEST PROCESSING FUNCTIONS 
***************************/

const aggregateTotalStats = (results) => {
    
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

const aggregateResultStats = (results) => results.map((result) => {
  if (result.skip) return result
  const executedTests = result.tests.filter(t => !t.skip)
  const [passed, failed] = seperate(executedTests, r => r.passed)
  return {
    ...result,
    totalCount: executedTests.length,
    passedCount: passed.length,
    failedCount: failed.length,
    passPercentage: passed.length / result.tests.length
  }
})

const logResults = (logger, resultTree) => {

  logger.debug(util.inspect(resultTree, { showHidden: false, depth: null }))

  const { yellow, green, red, bgRed, white, underline } = chalk

  const [executed, skipped] = seperate(resultTree.results, r => !r.skip)

  const logSkip = reason => logger.info(`${yellow('SKIP')} - ${reason}`)
  const logPass = name => logger.log(`${green('PASS')} - ${name}`)
  const logFail = name => logger.log(`${red('FAIL')} - ${name}`)

  for (const skip of skipped) {
    logSkip(skip.reason)
  }
  logger.info('')

  // Summary
  for (const fileResult of executed) {
    logger.log(underline.cyan(fileResult.filename))
    for (const test of fileResult.tests) {
      if (test.skip) {
        logSkip(test.reason)
      } else if (test.passed) {
        logPass(test.name)
      } else {
        logFail(test.name)
      }
    }
    logger.log('')
  }

  const {
    passedCount,
    failedCount,
    totalCount,
    passPercentage
  } = resultTree.stats

  const hasFailures = failedCount > 0

  // Error details
  if (hasFailures) {
    for (const fileResult of executed) {
      const executedTests = fileResult.tests.filter(t => !t.skip)
      for (const test of executedTests) {
        if (!test.passed) {
          logger.log('')
          logger.log(bgRed(white(`${test.name} -- ${fileResult.filename} -- ${fileResult.path}`)))
          logger.error(test.error)
        }
      }
    }
  }

  const color = hasFailures ? red : green
  const passPercentageString = (passPercentage * 100).toFixed(2).replace(/\.00$/,'')
  logger.log('')
  logger.log(`${color(passedCount)}/${color(totalCount)} passed (${color(passPercentageString + '%')})`)

}

const createLogger = (configuredLogLevel) => {

  const logLevelMap = {
    debug: 3,
    verbose: 2, 
    default: 1,
    error: 0,
    silent: -1 
  }

  const shouldLog = (level) => logLevelMap[level] <= logLevelMap[configuredLogLevel]
  const loggerForConfiguredLevel = (level) => shouldLog(level) ? console.log : () => { /* do nothing logger */ }
  
  return {
    log: loggerForConfiguredLevel('default'),
    info: loggerForConfiguredLevel('verbose'),
    debug: loggerForConfiguredLevel('debug'),
    error: loggerForConfiguredLevel('error')
  }
}

/**********  END TEST PROCESSING  **********/


