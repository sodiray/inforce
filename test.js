import chalk from 'chalk'

import * as aggregateTests from './test/aggregate.test.js'
import * as collectTests from './test/collect.test.js'
import * as logginTests from './test/logging.test.js'
import * as executeTests from './test/execute.test.js'
import * as _Tests from './test/_.test.js'

const testModules = [
  aggregateTests,
  collectTests,
  logginTests,
  executeTests,
  _Tests
]

const execute = async (tests) => await Promise.all(tests.map(async t => {
  try {
    await t.value()
    console.log(chalk.green(`PASS - ${t.key}`))
    return true
  } catch (err) {
    console.log(chalk.bgRedBright.white(t.key))
    console.error(err)
    console.log('')
    return false
  }
}));

const toEntry = (mod) => Object.entries(mod)
const toKeyValue = (entry) => { const [key, value] = entry; return { key, value } }
const handleResults = (results) => results.every(v => v) ? process.exit(0) : process.exit(1)

const tests = testModules.map(toEntry).flat(1).map(toKeyValue)
execute(tests).then(handleResults)