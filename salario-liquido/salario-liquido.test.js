const { calculateINSS, getINSSRate, calculateNetSalary } = require('./salario-liquido');

describe('getINSSRate', () => {
  it('should return 0.075 for salary in the first bracket (0 to 1412.0)', () => {
    expect(getINSSRate(0)).toBe(0.075);
    expect(getINSSRate(1000)).toBe(0.075);
    expect(getINSSRate(1412.0)).toBe(0.075);
  });

  it('should return 0.09 for salary in the second bracket (1412.01 to 2666.68)', () => {
    expect(getINSSRate(1412.01)).toBe(0.09);
    expect(getINSSRate(2000)).toBe(0.09);
    expect(getINSSRate(2666.68)).toBe(0.09);
  });

  it('should return 0.12 for salary in the third bracket (2666.69 to 4000.03)', () => {
    expect(getINSSRate(2666.69)).toBe(0.12);
    expect(getINSSRate(3000)).toBe(0.12);
    expect(getINSSRate(4000.03)).toBe(0.12);
  });

  it('should return 0.14 for salary in the fourth bracket (4000.04 and above)', () => {
    expect(getINSSRate(4000.04)).toBe(0.14);
    expect(getINSSRate(6000)).toBe(0.14);
    expect(getINSSRate(10000)).toBe(0.14); // Above ceiling
  });

  it('should return 0 for negative salary', () => {
    expect(getINSSRate(-100)).toBe(0);
  });
});

describe('calculateINSS', () => {
  it('should calculate INSS for salary within the first bracket', () => {
    // 0 to 1412.0 @ 7.5%
    // 1412.0 * 0.075 = 105.90
    const inss = calculateINSS(1412.00);
    expect(inss).toBeCloseTo(105.90, 2);
  });

  it('should calculate INSS for salary within the second bracket', () => {
    // 0 to 1412.0 @ 7.5% (105.90)
    // 1412.01 to 2666.68 @ 9%
    // Salary: 2000.00
    // Second bracket amount: 2000.00 - 1412.00 = 588.00
    // 588.00 * 0.09 = 52.92
    // Total INSS: 105.90 + 52.92 = 158.82
    const inss = calculateINSS(2000.00);
    expect(inss).toBeCloseTo(158.82, 2);
  });

  it('should calculate INSS for salary within the third bracket', () => {
    // 0 to 1412.0 @ 7.5% (105.90)
    // 1412.01 to 2666.68 @ 9% (2666.68 - 1412.00 = 1254.68 * 0.09 = 112.9212 -> 112.92)
    // 2666.69 to 4000.03 @ 12%
    // Salary: 3000.00
    // Third bracket amount: 3000.00 - 2666.68 = 333.32
    // 333.32 * 0.12 = 39.9984 -> 40.00
    // Total INSS: 105.90 + 112.92 + 40.00 = 258.82
    const inss = calculateINSS(3000.00);
    expect(inss).toBeCloseTo(258.82, 2);
  });

  it('should calculate INSS for salary within the fourth bracket', () => {
    // 0 to 1412.0 @ 7.5% (105.90)
    // 1412.01 to 2666.68 @ 9% (112.92)
    // 2666.69 to 4000.03 @ 12% (4000.03 - 2666.68 = 1333.35 * 0.12 = 160.002 -> 160.00)
    // 4000.04 to 7786.02 @ 14%
    // Salary: 5000.00
    // Fourth bracket amount: 5000.00 - 4000.03 = 999.97
    // 999.97 * 0.14 = 139.9958 -> 140.00
    // Total INSS: 105.90 + 112.92 + 160.00 + 140.00 = 518.82
    const inss = calculateINSS(5000.00);
    expect(inss).toBeCloseTo(518.82, 2);
  });

  it('should cap INSS calculation to the ceiling', () => {
    // Max progressive INSS is the sum of maximums of all brackets
    // B1: 1412.00 * 0.075 = 105.90
    // B2: (2666.68 - 1412.00) * 0.09 = 112.9212
    // B3: (4000.03 - 2666.68) * 0.12 = 160.002
    // B4: (7786.02 - 4000.03) * 0.14 = 530.0386
    // Total = 908.8618
    const ceiling = 908.8618;
    const inss = calculateINSS(10000.00); // Salary well above ceiling
    expect(inss).toBeCloseTo(ceiling, 2);
  });

  it('should return 0 for 0 salary', () => {
    const inss = calculateINSS(0);
    expect(inss).toBe(0);
  });

  it('should return 0 for negative salary', () => {
    const inss = calculateINSS(-1000);
    expect(inss).toBe(0);
  });
});

describe('calculateNetSalary', () => {
  it('should calculate net salary correctly without optional deductions', () => {
    // 3000 gross salary
    // INSS: 258.82
    // IRRF Base: 3000 - 258.82 = 2741.18
    // IRRF Bracket: 2259.21 to 2826.65 @ 7.5% with 169.44 deduction
    // IRRF Value: (2741.18 * 0.075) - 169.44 = 205.5885 - 169.44 = 36.1485 -> 36.15
    // Total Deductions = 258.82 + 36.15 = 294.97
    // Net Salary: 3000 - 294.97 = 2705.03
    const data = {
      grossSalary: 3000,
      dependents: 0,
      healthPlan: 0,
      mealVoucher: 0,
      transportVoucher: 0,
      otherDeductions: 0
    };

    const result = calculateNetSalary(data);

    expect(result.grossSalary).toBe(3000);
    expect(result.inss.value).toBeCloseTo(258.82, 2);
    expect(result.irrf.value).toBeCloseTo(36.15, 2);
    expect(result.netSalary).toBeCloseTo(2705.03, 2);
    expect(result.hasOptionalDeductions).toBe(false);
  });

  it('should calculate net salary correctly with dependents', () => {
    // Dependents affect the IRRF base
    // 3000 gross salary, 2 dependents
    // INSS: 258.82
    // Dependents Deduction: 2 * 189.59 = 379.18
    // IRRF Base: 3000 - 258.82 - 379.18 = 2362.00
    // IRRF Bracket: 2259.21 to 2826.65 @ 7.5% with 169.44 deduction
    // IRRF Value: (2362.00 * 0.075) - 169.44 = 177.15 - 169.44 = 7.71
    // Total Deductions = 258.82 + 7.71 = 266.53
    // Net Salary: 3000 - 266.53 = 2733.47

    const data = {
      grossSalary: 3000,
      dependents: 2,
      healthPlan: 0,
      mealVoucher: 0,
      transportVoucher: 0,
      otherDeductions: 0
    };

    const result = calculateNetSalary(data);

    expect(result.irrf.value).toBeCloseTo(7.71, 2);
    expect(result.netSalary).toBeCloseTo(2733.47, 2);
  });

  it('should calculate net salary with optional deductions', () => {
    // Health Plan affects the IRRF base
    // 5000 gross salary, health plan 200, meal voucher 50, other 100
    // INSS: 518.82
    // Health Plan Deduction: 200
    // IRRF Base: 5000 - 518.82 - 200 = 4281.18
    // IRRF Bracket: 3751.06 to 4664.68 @ 22.5% with 662.77 deduction
    // IRRF Value: (4281.18 * 0.225) - 662.77 = 963.2655 - 662.77 = 300.4955
    // Total Optional = 200 + 50 + 100 = 350
    // Total Deductions = 518.82 + 300.4955 + 350 = 1169.3155
    // Net Salary: 5000 - 1169.3155 = 3830.6845

    const data = {
      grossSalary: 5000,
      dependents: 0,
      healthPlan: 200,
      mealVoucher: 50,
      transportVoucher: 0,
      otherDeductions: 100
    };

    const result = calculateNetSalary(data);

    expect(result.irrf.value).toBeCloseTo(300.50, 2);
    expect(result.optional.total).toBe(350);
    expect(result.totalDeductions).toBeCloseTo(1169.3155, 2);
    expect(result.netSalary).toBeCloseTo(3830.6845, 2);
    expect(result.hasOptionalDeductions).toBe(true);
  });

  it('should cap the transport voucher to 6% of gross salary', () => {
    // 2000 gross salary
    // Transport Voucher max: 2000 * 0.06 = 120
    // If requested is 200, it should be capped at 120
    const data = {
      grossSalary: 2000,
      dependents: 0,
      healthPlan: 0,
      mealVoucher: 0,
      transportVoucher: 200,
      otherDeductions: 0
    };

    const result = calculateNetSalary(data);

    expect(result.optional.transportVoucher).toBe(120);
    expect(result.hasOptionalDeductions).toBe(true);
  });
});