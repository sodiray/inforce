import pathlib from 'path'
import fse from 'fs-extra'

import { withIgnoreSkipped, withPatternMatch, compose, asyncCompose, asyncMap } from './_.js'


export const collect = async (targetPath, testFileRegex, testFnRegex) => {

  const filePaths = await collectAllFilesUnderPath(targetPath)

  const processFile = asyncCompose(
    skipFileNotMatchingPattern(testFileRegex),
    loadFileModule,
    forEachTestFileExport(compose(
      skipExportNotFunction,
      skipExportNotMatchingPattern(testFnRegex))))
  
  return await asyncMap(filePaths, processFile)

}

export const collectAllFilesUnderPath = async (path) => {
  const stat = await fse.stat(path)
  if (!stat.isDirectory()) return [{ path, filename: pathlib.basename(path) }]
  const dir = await fse.readdir(path)
  const results = await asyncMap(dir, file => collectAllFilesUnderPath(`${path}/${file}`))
  return results.flat(1)
}

export const forEachTestFileExport = (fn) => withIgnoreSkipped(async (testFile) => ({
  ...testFile,
  tests: Object.entries(testFile.module).map((entry) => {
    const [key, value] = entry
    return fn(key, value)
  })
}))

export const skip = (obj, skipType) => ({ ...obj, skipType, skip: true })

export const loadFileModule = withIgnoreSkipped(async (testFile) => ({
  ...testFile, 
  module: await import(testFile.path)
}))

export const skipExportNotFunction = (name, fn) => typeof fn === 'function'  ? { fn, name } : skip({ fn, name }, 'export-type')

export const skipOrKeepExported = (exported) => !exported.match ? skip(exported, 'function-name') : exported
export const skipExportNotMatchingPattern = (pattern) => withIgnoreSkipped(withPatternMatch(pattern, a => a.name)(skipOrKeepExported))

export const skipOrKeepFile = async (file) => !file.match ? skip(file, 'file-name') : file
export const skipFileNotMatchingPattern = (pattern) => withPatternMatch(pattern, a => a.filename)(skipOrKeepFile)
