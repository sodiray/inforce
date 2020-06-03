import { asyncMap, withIgnoreSkipped } from './_.js'


export const executeTest = withIgnoreSkipped(async (test) => {
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
})

export const executeAllTestsForFile = withIgnoreSkipped(async (testFile) => ({
  ...testFile,
  tests: await asyncMap(testFile.tests, executeTest)
}))

export const runCollectedTests = async (collectedTests) => await asyncMap(collectedTests, executeAllTestsForFile)