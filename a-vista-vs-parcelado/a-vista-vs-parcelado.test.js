const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

// Mock DOM
const fakeDOM = {
  getElementById: () => ({
    addEventListener: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} }
  }),
  querySelector: () => ({ remove: () => {}, className: '' }),
  createElement: () => ({}),
  addEventListener: () => {}
};

global.document = fakeDOM;
global.window = {};
global.setInterval = () => {};

// Load Script
const scriptContent = fs.readFileSync('./a-vista-vs-parcelado/a-vista-vs-parcelado.js', 'utf8');
eval(scriptContent);

const fc = window.SimulacaoFinanceira.FinancialCalculator;

test('calculateInstallmentCost - Standard scenario', (t) => {
  const result = fc.calculateInstallmentCost(1000, 900, 10, 10);

  assert.strictEqual(result.installmentValue, 100);
  assert.strictEqual(result.totalCost, 1000);

  // Use approximate assertions due to floating point precision
  const isApproxEqual = (actual, expected, tolerance = 0.001) => Math.abs(actual - expected) < tolerance;

  assert.ok(isApproxEqual(result.effectiveCost, 957.505), `effectiveCost ${result.effectiveCost} not close to 957.505`);
  assert.ok(isApproxEqual(result.selicReturn, 936.46), `selicReturn ${result.selicReturn} not close to 936.46`);
  assert.ok(isApproxEqual(result.opportunityCost, 36.46), `opportunityCost ${result.opportunityCost} not close to 36.46`);
  assert.ok(isApproxEqual(result.presentValueOfInstallments, 957.505), `presentValueOfInstallments ${result.presentValueOfInstallments} not close to 957.505`);
});

test('calculateInstallmentCost - Zero Selic Rate', (t) => {
  const result = fc.calculateInstallmentCost(1000, 900, 0, 10);

  assert.strictEqual(result.installmentValue, 100);
  assert.strictEqual(result.totalCost, 1000);
  assert.strictEqual(result.effectiveCost, 1000);
  assert.strictEqual(result.selicReturn, 900);
  assert.strictEqual(result.opportunityCost, 0);
  assert.strictEqual(result.presentValueOfInstallments, 1000);
});

test('calculateInstallmentCost - Single installment', (t) => {
  const result = fc.calculateInstallmentCost(1000, 900, 10, 1);

  assert.strictEqual(result.installmentValue, 1000);
  assert.strictEqual(result.totalCost, 1000);

  const isApproxEqual = (actual, expected, tolerance = 0.001) => Math.abs(actual - expected) < tolerance;

  // presentValueOfInstallments = 1000 / (1 + monthlyRate)
  // opportunityCost = selicReturn - 900
  // selicReturn = 900 * (1 + monthlyRate)^(1/2)

  const monthlyRate = fc.annualToMonthlyRate(10);
  const expectedPV = 1000 / (1 + monthlyRate);
  const expectedSelicReturn = 900 * Math.pow(1 + monthlyRate, 0.5);

  assert.ok(isApproxEqual(result.presentValueOfInstallments, expectedPV), 'PV mismatch');
  assert.ok(isApproxEqual(result.effectiveCost, expectedPV), 'effective cost mismatch');
  assert.ok(isApproxEqual(result.selicReturn, expectedSelicReturn), 'selic return mismatch');
  assert.ok(isApproxEqual(result.opportunityCost, expectedSelicReturn - 900), 'opportunity cost mismatch');
});
