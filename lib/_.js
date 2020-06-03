

export const asyncCompose = (...funcs) => (...args) => funcs.slice(1).reduce((chain, fn) => chain.then(fn), Promise.resolve(funcs[0](...args)))
export const compose = (...funcs) => (...args) => funcs.slice(1).reduce((acc, fn) => fn(acc), funcs[0](...args))
export const sum = (list, getter) => list.reduce((a, b) => a + getter(b), 0)
export const asyncMap = async (list, mapFn) => await Promise.all(list.map(mapFn))

export const seperate = (list, condition) => list.reduce((acc, next) => {
  const [passed, failed] = acc
  if (condition(next)) return [ [...passed, next ], failed]
  return [passed, [...failed, next]]
}, [ [/** passed **/], [/** failed **/] ])

export const withIgnoreSkipped = (fn) => (arg) => !!arg.skip ? arg : fn(arg)
export const withPatternMatch = (pattern, getter) => (fn) => (arg) => fn({ ...arg, pattern, match: getter(arg).match(pattern) })