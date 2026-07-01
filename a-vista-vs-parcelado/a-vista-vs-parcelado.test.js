const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.document = {
  getElementById: () => ({ addEventListener: () => {} }),
  querySelector: () => ({ className: '' }),
  addEventListener: () => {}
};
global.window = {};
global.setInterval = () => {};

// Load the script
const scriptPath = path.join(__dirname, 'a-vista-vs-parcelado.js');
const code = fs.readFileSync(scriptPath, 'utf8');
eval(code);

// Get it from window since it exports there
const { FinancialCalculator } = window.SimulacaoFinanceira;

test('FinancialCalculator.calculateCashCost', async (t) => {
  await t.test('calculates correct cash cost and monthly rate', () => {
    const cashValue = 900;
    const productValue = 1000;
    const selicRate = 12; // 12% a.a.
    const installments = 10;

    const expectedMonthlyRate = Math.pow(1 + 12 / 100, 1 / 12) - 1;

    const result = FinancialCalculator.calculateCashCost(
      cashValue,
      productValue,
      selicRate,
      installments
    );

    assert.deepStrictEqual(result, {
      cashPayment: cashValue,
      effectiveCost: cashValue,
      monthlyRate: expectedMonthlyRate
    });
  });

  await t.test('calls this.annualToMonthlyRate correctly', () => {
    const originalAnnualToMonthlyRate = FinancialCalculator.annualToMonthlyRate;
    let mockCalledWith = null;

    // Mock the method
    FinancialCalculator.annualToMonthlyRate = (rate) => {
      mockCalledWith = rate;
      return 0.05; // 5% mock monthly rate
    };

    const result = FinancialCalculator.calculateCashCost(500, 600, 15, 5);

    assert.strictEqual(mockCalledWith, 15, 'annualToMonthlyRate should be called with selicRate');
    assert.strictEqual(result.monthlyRate, 0.05, 'Should use the result from annualToMonthlyRate');
    assert.strictEqual(result.cashPayment, 500);
    assert.strictEqual(result.effectiveCost, 500);

    // Restore
    FinancialCalculator.annualToMonthlyRate = originalAnnualToMonthlyRate;
  });

  await t.test('works correctly with boundary values', () => {
    // Zero selic rate
    let result = FinancialCalculator.calculateCashCost(1000, 1200, 0, 12);
    assert.strictEqual(result.monthlyRate, 0);
    assert.strictEqual(result.cashPayment, 1000);
    assert.strictEqual(result.effectiveCost, 1000);

    // High selic rate
    result = FinancialCalculator.calculateCashCost(100, 200, 100, 5);
    const expectedRate = Math.pow(2, 1/12) - 1; // 100% is 1 + 100/100 = 2
    assert.ok(Math.abs(result.monthlyRate - expectedRate) < 1e-10);
  });
});
