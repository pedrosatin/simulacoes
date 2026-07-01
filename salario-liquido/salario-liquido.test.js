const test = require('node:test');
const assert = require('node:assert');

// Mock document for require
if (typeof document === 'undefined') {
  global.document = {
    addEventListener: () => {},
    getElementById: () => ({ value: '', addEventListener: () => {}, style: {} }),
  };
}

const { calculateNetSalary, calculateINSS, calculateIRRF } = require('./salario-liquido');

// Helper to assert closeness for floating points
function assertClose(actual, expected, tolerance = 0.01, message) {
  if (Math.abs(actual - expected) > tolerance) {
    assert.fail(message || `Expected ${actual} to be close to ${expected} (tolerance ${tolerance})`);
  }
}

test('calculateNetSalary calculates minimum wage correctly', (t) => {
  const data = {
    grossSalary: 1412.0,
    dependents: 0,
    healthPlan: 0,
    mealVoucher: 0,
    transportVoucher: 0,
    otherDeductions: 0
  };
  const result = calculateNetSalary(data);
  // INSS for 1412 should be 1412 * 0.075 = 105.9
  assertClose(result.inss.value, 105.9);
  // IRRF should be 0 since 1412 - 105.9 = 1306.1 < 2259.20
  assertClose(result.irrf.value, 0);
  assertClose(result.netSalary, 1412.0 - 105.9);
});

test('calculateNetSalary calculates higher salary with IRRF and INSS ceiling', (t) => {
  const data = {
    grossSalary: 10000.0,
    dependents: 0,
    healthPlan: 0,
    mealVoucher: 0,
    transportVoucher: 0,
    otherDeductions: 0
  };
  const result = calculateNetSalary(data);
  // Actual calculated INSS limit based on brackets is 908.86
  assertClose(result.inss.value, 908.86);

  // IRRF base = 10000 - 908.86 = 9091.14
  // > 4664.68, so bracket 5: 27.5%, deduction 896
  // IRRF = 9091.14 * 0.275 - 896 = 2500.06 - 896 = 1604.06
  assertClose(result.irrf.value, 1604.06, 0.05);

  assertClose(result.netSalary, 10000.0 - 908.86 - 1604.06, 0.05);
});

test('calculateNetSalary applies dependents deduction correctly', (t) => {
  const data = {
    grossSalary: 5000.0,
    dependents: 2,
    healthPlan: 0,
    mealVoucher: 0,
    transportVoucher: 0,
    otherDeductions: 0
  };
  const result = calculateNetSalary(data);
  // Dependent deduction in 2025 is 189.59

  // INSS for 5000:
  // 1412 * 0.075 = 105.9
  // (2666.68 - 1412) * 0.09 = 112.92
  // (4000.03 - 2666.68) * 0.12 = 160.00
  // (5000 - 4000.03) * 0.14 = 139.99
  // Total INSS ~ 518.81
  assertClose(result.inss.value, 518.82, 0.05);

  // IRRF Base without dependents = 5000 - 518.82 = 4481.18
  // With 2 dependents (379.18) = 4102.00
  // Bracket 4: 22.5%, deduction 662.77
  // IRRF = 4102.00 * 0.225 - 662.77 = 922.95 - 662.77 = 260.18
  assertClose(result.irrf.value, 260.18, 0.05);

  assertClose(result.netSalary, 5000 - 518.82 - 260.18, 0.05);
});

test('calculateNetSalary limits transport voucher to 6% of gross salary', (t) => {
  const data = {
    grossSalary: 3000.0,
    dependents: 0,
    healthPlan: 0,
    mealVoucher: 0,
    transportVoucher: 500.0, // 500 > 6% of 3000 (180)
    otherDeductions: 0
  };
  const result = calculateNetSalary(data);

  // The actual transport voucher deducted should be 180
  assertClose(result.optional.transportVoucher, 180.0);

  // Optional total should be exactly 180
  assertClose(result.optional.total, 180.0);
});

test('calculateNetSalary allows transport voucher if below 6% of gross salary', (t) => {
  const data = {
    grossSalary: 3000.0,
    dependents: 0,
    healthPlan: 0,
    mealVoucher: 0,
    transportVoucher: 100.0, // 100 < 6% of 3000 (180)
    otherDeductions: 0
  };
  const result = calculateNetSalary(data);

  assertClose(result.optional.transportVoucher, 100.0);
  assertClose(result.optional.total, 100.0);
});

test('calculateNetSalary handles all optional deductions properly', (t) => {
  const data = {
    grossSalary: 4000.0,
    dependents: 0,
    healthPlan: 200.0,
    mealVoucher: 150.0,
    transportVoucher: 100.0, // < 240 limit
    otherDeductions: 50.0
  };

  const result = calculateNetSalary(data);

  // Health plan reduces IRRF base
  // INSS ~ 378.82
  assertClose(result.inss.value, 378.82, 0.05);

  // IRRF base = 4000 - 378.82 (INSS) - 200 (Health plan) = 3421.18
  // Bracket 3: 15%, deduction 381.44
  // IRRF = 3421.18 * 0.15 - 381.44 = 513.177 - 381.44 = 131.74
  assertClose(result.irrf.value, 131.74, 0.05);

  // Optional total = 200 + 150 + 100 + 50 = 500
  assertClose(result.optional.total, 500.0);

  // Net salary = 4000 - 378.82 - 131.74 - 500 = 2989.44
  assertClose(result.netSalary, 2989.44, 0.05);
  assert.strictEqual(result.hasOptionalDeductions, true);
});
