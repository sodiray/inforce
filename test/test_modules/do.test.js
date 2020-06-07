
const add = (a, b) => a + b
const sum = (list) => list.reduce((acc, n) => acc + n, 23 /* bug to demo broken tests */)
const nowait = value => new Promise(resolve => setTimeout(() => resolve(value)))

// Stub assert func for example. Better 
// to use a good assertion lib like chai
const assert = (value, message) => {
  if (!!value) return
  throw `${message}`
}

export const test_add = () => {
  const expected = 4
  const result = add(2, 2)
  assert(expected === result, 'Expected 4')
}

export const test_sum_fail_example = () => {
  const expected = 10
  const result = sum([ 5, 5 ])
  assert(expected === result, 'Expected 10')
}

export const notAFunction = 22 /** ignored **/
export const notAValidTes_tFuncName = () => 'I wont run'

export const test_nowait_async_example = async () => {
  const result = await nowait('yes')
  assert(result === 'yes', 'Expected yes')
}