import util from 'util'
import chalk from 'chalk'

import { seperate } from './_.js'


const LOG_LEVEL_MAP = {
  debug: 3,
  verbose: 2, 
  default: 1,
  error: 0,
  silent: -1 
}

export const shouldLog = (configuredLogLevel) => (level) => LOG_LEVEL_MAP[level] <= LOG_LEVEL_MAP[configuredLogLevel]

export const createLogger = (configuredLogLevel) => {

  const ifLogging = shouldLog(configuredLogLevel)
  const nada = () => { /* do nothing (a.k.a nada) logger */ }

  return {
    log: ifLogging('default') ? console.log : nada,
    info: ifLogging('verbose') ? console.info : nada,
    debug: ifLogging('debug') ? console.debug : nada,
    error: ifLogging('error') ? console.error : nada
  }
  
}


export const logResults = (logger, resultTree) => {

  logger.debug(util.inspect(resultTree, { showHidden: false, depth: null }))

  const { yellow, green, red, bgRed, white, underline } = chalk

  const [executed, skipped] = seperate(resultTree.results, r => !r.skip)

  const logPass = name => logger.log(`${green('PASS')} - ${name}`)
  const logFail = name => logger.log(`${red('FAIL')} - ${name}`)
  const logSkip = reason => logger.info(`${yellow('SKIP')} - ${reason}`)


  for (const skip of skipped) {
    logSkip(`file (${skip.filename}) does not match test file naming pattern (${skip.pattern})`)
  }
  logger.info('')

  // Summary
  for (const fileResult of executed) {
    logger.log(underline.cyan(fileResult.filename))
    for (const test of fileResult.tests) {
      if (test.skip) {
        if (test.skipType === 'function-name') {
          logSkip(`function (${test.name}) does not match pattern (${test.pattern})`)
        } else if (test.skipType === 'export-type') {
          logSkip(`export (${test.name}) is not a function`)
        }
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