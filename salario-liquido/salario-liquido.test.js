const { calculateINSS, calculateIRRF } = require('./salario-liquido');

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

describe('calculateIRRF', () => {
  it('should calculate IRRF for salary within the first bracket', () => {
    // 0 to 2259.20 @ 0%
    const irrf = calculateIRRF(2000.00);
    expect(irrf).toBe(0);
  });

  it('should calculate IRRF for salary within the second bracket', () => {
    // 2259.21 to 2826.65 @ 7.5% - 169.44
    // 2500 * 0.075 = 187.5 - 169.44 = 18.06
    const irrf = calculateIRRF(2500.00);
    expect(irrf).toBeCloseTo(18.06, 2);
  });

  it('should calculate IRRF for salary within the third bracket', () => {
    // 2826.66 to 3751.05 @ 15% - 381.44
    // 3000 * 0.15 = 450 - 381.44 = 68.56
    const irrf = calculateIRRF(3000.00);
    expect(irrf).toBeCloseTo(68.56, 2);
  });

  it('should calculate IRRF for salary within the fourth bracket', () => {
    // 3751.06 to 4664.68 @ 22.5% - 662.77
    // 4000 * 0.225 = 900 - 662.77 = 237.23
    const irrf = calculateIRRF(4000.00);
    expect(irrf).toBeCloseTo(237.23, 2);
  });

  it('should calculate IRRF for salary within the fifth bracket', () => {
    // 4664.69+ @ 27.5% - 896.00
    // 5000 * 0.275 = 1375 - 896.00 = 479.00
    const irrf = calculateIRRF(5000.00);
    expect(irrf).toBeCloseTo(479.00, 2);
  });

  it('should return 0 for 0 salary', () => {
    const irrf = calculateIRRF(0);
    expect(irrf).toBe(0);
  });

  it('should return 0 for negative salary', () => {
    const irrf = calculateIRRF(-1000);
    expect(irrf).toBe(0);
  });

  it('should return 0 if irrf calculates to less than 0', () => {
    // Should never happen realistically because of deduction logic,
    // but the function has Math.max(0, irrf) just in case.
    const irrf = calculateIRRF(2259.21);
    // 2259.21 * 0.075 = 169.44075 - 169.44 = 0.00075
    expect(irrf).toBeCloseTo(0, 2);
  });
});
