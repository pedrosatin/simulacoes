const { calculateINSS } = require('./salario-liquido');

describe('calculateINSS', () => {
  it('should calculate INSS for salary within the first bracket', () => {
    // 0 to 1412.0 @ 7.5%
    // 1412.0 * 0.075 = 105.90
    const inss = calculateINSS(1412.00);
    expect(inss.value).toBeCloseTo(105.90, 2);
    expect(inss.rate).toBe(0.075);
  });

  it('should calculate INSS for salary within the second bracket', () => {
    // 0 to 1412.0 @ 7.5% (105.90)
    // 1412.01 to 2666.68 @ 9%
    // Salary: 2000.00
    // Second bracket amount: 2000.00 - 1412.00 = 588.00
    // 588.00 * 0.09 = 52.92
    // Total INSS: 105.90 + 52.92 = 158.82
    const inss = calculateINSS(2000.00);
    expect(inss.value).toBeCloseTo(158.82, 2);
    expect(inss.rate).toBe(0.09);
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
    expect(inss.value).toBeCloseTo(258.82, 2);
    expect(inss.rate).toBe(0.12);
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
    expect(inss.value).toBeCloseTo(518.82, 2);
    expect(inss.rate).toBe(0.14);
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
    expect(inss.value).toBeCloseTo(ceiling, 2);
    expect(inss.rate).toBe(0.14);
  });

  it('should return 0 for 0 salary', () => {
    const inss = calculateINSS(0);
    expect(inss.value).toBe(0);
    expect(inss.rate).toBe(0.075);
  });

  it('should return 0 for negative salary', () => {
    const inss = calculateINSS(-1000);
    expect(inss.value).toBe(0);
    expect(inss.rate).toBe(0);
  });
});