const test = require('node:test')
const assert = require('node:assert')
const RegraDeTresCalculadora = require('./regra-de-tres.js')

test('RegraDeTresCalculadora - calcularRegraDeTresCore', async (t) => {
  const calc = new RegraDeTresCalculadora()

  await t.test('calculates simple direct proportion correctly', () => {
    // A/B = C/X => 2/4 = 3/X => X = (4*3)/2 = 6
    const result = calc.calcularRegraDeTresCore(2, 4, 3)
    assert.strictEqual(result, 6)
  })

  await t.test('calculates with fractional numbers', () => {
    // A/B = C/X => 1.5/2.5 = 3/X => X = (2.5*3)/1.5 = 5
    const result = calc.calcularRegraDeTresCore(1.5, 2.5, 3)
    assert.strictEqual(result, 5)
  })

  await t.test('returns null when valorA is 0', () => {
    const result = calc.calcularRegraDeTresCore(0, 4, 3)
    assert.strictEqual(result, null)
  })

  await t.test('returns null when valorA is missing (falsy)', () => {
    const result = calc.calcularRegraDeTresCore('', 4, 3)
    assert.strictEqual(result, null)

    const result2 = calc.calcularRegraDeTresCore(null, 4, 3)
    assert.strictEqual(result2, null)

    const result3 = calc.calcularRegraDeTresCore(undefined, 4, 3)
    assert.strictEqual(result3, null)
  })

  await t.test('calculates correctly when valorB is 0', () => {
    // A/B = C/X => 2/0 = 3/X => X = (0*3)/2 = 0
    const result = calc.calcularRegraDeTresCore(2, 0, 3)
    assert.strictEqual(result, 0)
  })

  await t.test('calculates correctly when valorC is 0', () => {
    // A/B = C/X => 2/4 = 0/X => X = (4*0)/2 = 0
    const result = calc.calcularRegraDeTresCore(2, 4, 0)
    assert.strictEqual(result, 0)
  })
})
