const test = require('node:test');
const assert = require('node:assert');
const { calculateIRRF } = require('./salario-liquido.js');

// Helper function to handle floating point issues and round to 2 decimals like currency
function round(value) {
  return Math.round(value * 100) / 100;
}

test('calculateIRRF correctly calculates tax for all brackets', async (t) => {
  await t.test('Bracket 1: 0 to 2259.20 (0% rate)', () => {
    assert.strictEqual(calculateIRRF(0), 0);
    assert.strictEqual(calculateIRRF(1000), 0);
    assert.strictEqual(calculateIRRF(2259.20), 0);
  });

  await t.test('Bracket 2: 2259.21 to 2826.65 (7.5% rate, 169.44 deduction)', () => {
    // 2259.21 * 0.075 - 169.44 = 0.00
    assert.strictEqual(round(calculateIRRF(2259.21)), 0);
    // 2500 * 0.075 - 169.44 = 18.06
    assert.strictEqual(round(calculateIRRF(2500)), 18.06);
    // 2826.65 * 0.075 - 169.44 = 42.56
    assert.strictEqual(round(calculateIRRF(2826.65)), 42.56);
  });

  await t.test('Bracket 3: 2826.66 to 3751.05 (15% rate, 381.44 deduction)', () => {
    // 2826.66 * 0.15 - 381.44 = 42.56
    assert.strictEqual(round(calculateIRRF(2826.66)), 42.56);
    // 3000 * 0.15 - 381.44 = 68.56
    assert.strictEqual(round(calculateIRRF(3000)), 68.56);
    // 3751.05 * 0.15 - 381.44 = 181.22
    assert.strictEqual(round(calculateIRRF(3751.05)), 181.22);
  });

  await t.test('Bracket 4: 3751.06 to 4664.68 (22.5% rate, 662.77 deduction)', () => {
    // 3751.06 * 0.225 - 662.77 = 181.22
    assert.strictEqual(round(calculateIRRF(3751.06)), 181.22);
    // 4000 * 0.225 - 662.77 = 237.23
    assert.strictEqual(round(calculateIRRF(4000)), 237.23);
    // 4664.68 * 0.225 - 662.77 = 386.78
    assert.strictEqual(round(calculateIRRF(4664.68)), 386.78);
  });

  await t.test('Bracket 5: 4664.69 and above (27.5% rate, 896.00 deduction)', () => {
    // 4664.69 * 0.275 - 896.00 = 386.79
    assert.strictEqual(round(calculateIRRF(4664.69)), 386.79);
    // 10000 * 0.275 - 896.00 = 1854.00
    assert.strictEqual(round(calculateIRRF(10000)), 1854.00);
  });
});

test('calculateIRRF handles edge cases', async (t) => {
  await t.test('Negative income returns 0', () => {
    assert.strictEqual(calculateIRRF(-1000), 0);
    assert.strictEqual(calculateIRRF(-1), 0);
  });

  await t.test('Infinity returns correct calculation', () => {
    // Math.max(0, Infinity * 0.275 - 896.0) -> Infinity
    assert.strictEqual(calculateIRRF(Infinity), Infinity);
  });
});
