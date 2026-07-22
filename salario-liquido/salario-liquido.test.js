const {
  calculateINSS,
  getINSSRate,
  calculateNetSalary,
  calculateIRRF,
  getIRRFRate,
  validateTransportVoucher,
} = require('./salario-liquido')

describe('getINSSRate', () => {
  it('should return 0.075 for salary in the first bracket (0 to 1412.0)', () => {
    expect(getINSSRate(0)).toBe(0.075)
    expect(getINSSRate(1000)).toBe(0.075)
    expect(getINSSRate(1412.0)).toBe(0.075)
  })

  it('should return 0.09 for salary in the second bracket (1412.01 to 2666.68)', () => {
    expect(getINSSRate(1412.01)).toBe(0.09)
    expect(getINSSRate(2000)).toBe(0.09)
    expect(getINSSRate(2666.68)).toBe(0.09)
  })

  it('should return 0.12 for salary in the third bracket (2666.69 to 4000.03)', () => {
    expect(getINSSRate(2666.69)).toBe(0.12)
    expect(getINSSRate(3000)).toBe(0.12)
    expect(getINSSRate(4000.03)).toBe(0.12)
  })

  it('should return 0.14 for salary in the fourth bracket (4000.04 and above)', () => {
    expect(getINSSRate(4000.04)).toBe(0.14)
    expect(getINSSRate(6000)).toBe(0.14)
    expect(getINSSRate(10000)).toBe(0.14) // Above ceiling
  })

  it('should return 0 for negative salary', () => {
    expect(getINSSRate(-100)).toBe(0)
  })

  it('should handle edge cases like NaN, null, and undefined', () => {
    expect(getINSSRate(NaN)).toBe(0)
    expect(getINSSRate(null)).toBe(0)
    expect(getINSSRate(undefined)).toBe(0)
  })
})

describe('calculateINSS', () => {
  it('should calculate INSS for salary within the first bracket', () => {
    // 0 to 1412.0 @ 7.5%
    // 1412.0 * 0.075 = 105.90
    const inss = calculateINSS(1412.0)
    expect(inss).toBeCloseTo(105.9, 2)
  })

  it('should calculate INSS for salary within the second bracket', () => {
    // 0 to 1412.0 @ 7.5% (105.90)
    // 1412.01 to 2666.68 @ 9%
    // Salary: 2000.00
    // Second bracket amount: 2000.00 - 1412.00 = 588.00
    // 588.00 * 0.09 = 52.92
    // Total INSS: 105.90 + 52.92 = 158.82
    const inss = calculateINSS(2000.0)
    expect(inss).toBeCloseTo(158.82, 2)
  })

  it('should calculate INSS for salary within the third bracket', () => {
    // 0 to 1412.0 @ 7.5% (105.90)
    // 1412.01 to 2666.68 @ 9% (2666.68 - 1412.00 = 1254.68 * 0.09 = 112.9212 -> 112.92)
    // 2666.69 to 4000.03 @ 12%
    // Salary: 3000.00
    // Third bracket amount: 3000.00 - 2666.68 = 333.32
    // 333.32 * 0.12 = 39.9984 -> 40.00
    // Total INSS: 105.90 + 112.92 + 40.00 = 258.82
    const inss = calculateINSS(3000.0)
    expect(inss).toBeCloseTo(258.82, 2)
  })

  it('should calculate INSS for salary within the fourth bracket', () => {
    // 0 to 1412.0 @ 7.5% (105.90)
    // 1412.01 to 2666.68 @ 9% (112.92)
    // 2666.69 to 4000.03 @ 12% (4000.03 - 2666.68 = 1333.35 * 0.12 = 160.002 -> 160.00)
    // 4000.04 to 7786.02 @ 14%
    // Salary: 5000.00
    // Fourth bracket amount: 5000.00 - 4000.03 = 999.97
    // 999.97 * 0.14 = 139.9958 -> 140.00
    // Total INSS: 105.90 + 112.92 + 160.00 + 140.00 = 518.82
    const inss = calculateINSS(5000.0)
    expect(inss).toBeCloseTo(518.82, 2)
  })

  it('should cap INSS calculation to the ceiling', () => {
    // Max progressive INSS is the sum of maximums of all brackets
    // B1: 1412.00 * 0.075 = 105.90
    // B2: (2666.68 - 1412.00) * 0.09 = 112.9212
    // B3: (4000.03 - 2666.68) * 0.12 = 160.002
    // B4: (7786.02 - 4000.03) * 0.14 = 530.0386
    // Total = 908.8618
    const ceiling = 908.8618
    const inss = calculateINSS(10000.0) // Salary well above ceiling
    expect(inss).toBeCloseTo(ceiling, 2)
  })

  it('should return 0 for 0 salary', () => {
    const inss = calculateINSS(0)
    expect(inss).toBe(0)
  })

  it('should return 0 for negative salary', () => {
    const inss = calculateINSS(-1000)
    expect(inss).toBe(0)
  })
})

describe('validateTransportVoucher', () => {
  it('should return the transport value when it is less than 6% of gross salary', () => {
    // 6% of 2000 is 120
    const result = validateTransportVoucher(100, 2000)
    expect(result).toBe(100)
  })

  it('should return the transport value when it is exactly 6% of gross salary', () => {
    // 6% of 2000 is 120
    const result = validateTransportVoucher(120, 2000)
    expect(result).toBe(120)
  })

  it('should cap the transport value at 6% of gross salary', () => {
    // 6% of 2000 is 120
    const result = validateTransportVoucher(200, 2000)
    expect(result).toBe(120)
  })

  it('should return 0 when transport value is 0', () => {
    const result = validateTransportVoucher(0, 2000)
    expect(result).toBe(0)
  })

  it('should return 0 when gross salary is 0', () => {
    const result = validateTransportVoucher(100, 0)
    expect(result).toBe(0)
  })
})

describe('calculateIRRF', () => {
  it('should return 0 for income in the first bracket (exempt)', () => {
    const irrf = calculateIRRF(2000.0)
    expect(irrf).toBe(0)
  })

  it('should calculate IRRF for income in the second bracket (7.5%)', () => {
    // 2500.00 * 0.075 - 169.44 = 18.06
    const irrf = calculateIRRF(2500.0)
    expect(irrf).toBeCloseTo(18.06, 2)
  })

  it('should calculate IRRF for income in the third bracket (15%)', () => {
    // 3000.00 * 0.15 - 381.44 = 68.56
    const irrf = calculateIRRF(3000.0)
    expect(irrf).toBeCloseTo(68.56, 2)
  })

  it('should calculate IRRF for income in the fourth bracket (22.5%)', () => {
    // 4000.00 * 0.225 - 662.77 = 237.23
    const irrf = calculateIRRF(4000.0)
    expect(irrf).toBeCloseTo(237.23, 2)
  })

  it('should calculate IRRF for income in the fifth bracket (27.5%)', () => {
    // 5000.00 * 0.275 - 896.00 = 479.00
    const irrf = calculateIRRF(5000.0)
    expect(irrf).toBeCloseTo(479.0, 2)
  })

  it('should return 0 for 0 income', () => {
    const irrf = calculateIRRF(0)
    expect(irrf).toBe(0)
  })

  it('should return 0 for negative income', () => {
    const irrf = calculateIRRF(-1000.0)
    expect(irrf).toBe(0)
  })

  it('should handle boundary values for the first bracket (max 2259.20)', () => {
    const irrf = calculateIRRF(2259.2)
    expect(irrf).toBe(0)
  })

  it('should handle boundary values for the second bracket (min 2259.21, max 2826.65)', () => {
    const irrfMin = calculateIRRF(2259.21)
    expect(irrfMin).toBeCloseTo(0.00075, 5) // (2259.21 * 0.075) - 169.44 = 169.44075 - 169.44 = 0.00075

    const irrfMax = calculateIRRF(2826.65)
    expect(irrfMax).toBeCloseTo(42.55875, 5) // (2826.65 * 0.075) - 169.44 = 211.99875 - 169.44 = 42.55875
  })

  it('should handle boundary values for the third bracket (min 2826.66, max 3751.05)', () => {
    const irrfMin = calculateIRRF(2826.66)
    expect(irrfMin).toBeCloseTo(42.559, 3) // (2826.66 * 0.15) - 381.44 = 423.999 - 381.44 = 42.559

    const irrfMax = calculateIRRF(3751.05)
    expect(irrfMax).toBeCloseTo(181.2175, 4) // (3751.05 * 0.15) - 381.44 = 562.6575 - 381.44 = 181.2175
  })

  it('should handle boundary values for the fourth bracket (min 3751.06, max 4664.68)', () => {
    const irrfMin = calculateIRRF(3751.06)
    expect(irrfMin).toBeCloseTo(181.2185, 4) // (3751.06 * 0.225) - 662.77 = 843.9885 - 662.77 = 181.2185

    const irrfMax = calculateIRRF(4664.68)
    expect(irrfMax).toBeCloseTo(386.783, 3) // (4664.68 * 0.225) - 662.77 = 1049.553 - 662.77 = 386.783
  })

  it('should handle boundary values for the fifth bracket (min 4664.69, max Infinity)', () => {
    const irrfMin = calculateIRRF(4664.69)
    expect(irrfMin).toBeCloseTo(386.78975, 5) // (4664.69 * 0.275) - 896.0 = 1282.78975 - 896.0 = 386.78975

    const irrfMax = calculateIRRF(Infinity)
    expect(irrfMax).toBe(Infinity) // Infinity * 0.275 - 896.0 = Infinity
  })

  it('should return 0 for NaN', () => {
    const irrf = calculateIRRF(NaN)
    expect(irrf).toBe(0)
  })

  it('should return 0 for non-numeric strings', () => {
    const irrf = calculateIRRF('invalid')
    expect(irrf).toBe(0)
  })
})

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
      otherDeductions: 0,
    }

    const result = calculateNetSalary(data)

    expect(result.grossSalary).toBe(3000)
    expect(result.inss.value).toBeCloseTo(258.82, 2)
    expect(result.irrf.value).toBeCloseTo(36.15, 2)
    expect(result.netSalary).toBeCloseTo(2705.03, 2)
    expect(result.hasOptionalDeductions).toBe(false)
  })

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
      otherDeductions: 0,
    }

    const result = calculateNetSalary(data)

    expect(result.irrf.value).toBeCloseTo(7.71, 2)
    expect(result.netSalary).toBeCloseTo(2733.47, 2)
  })

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
      otherDeductions: 100,
    }

    const result = calculateNetSalary(data)

    expect(result.irrf.value).toBeCloseTo(300.5, 2)
    expect(result.optional.total).toBe(350)
    expect(result.totalDeductions).toBeCloseTo(1169.3155, 2)
    expect(result.netSalary).toBeCloseTo(3830.6845, 2)
    expect(result.hasOptionalDeductions).toBe(true)
  })

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
      otherDeductions: 0,
    }

    const result = calculateNetSalary(data)

    expect(result.optional.transportVoucher).toBe(120)
    expect(result.hasOptionalDeductions).toBe(true)
  })
})

describe('getIRRFRate', () => {
  it('should return 0 for income in the first bracket (<= 2259.20)', () => {
    expect(getIRRFRate(2259.2)).toBe(0)
    expect(getIRRFRate(1000)).toBe(0)
    expect(getIRRFRate(0)).toBe(0)
    expect(getIRRFRate(-500)).toBe(0)
  })

  it('should return 0.075 for income in the second bracket (2259.21 to 2826.65)', () => {
    expect(getIRRFRate(2259.21)).toBe(0.075)
    expect(getIRRFRate(2500)).toBe(0.075)
    expect(getIRRFRate(2826.65)).toBe(0.075)
  })

  it('should return 0.15 for income in the third bracket (2826.66 to 3751.05)', () => {
    expect(getIRRFRate(2826.66)).toBe(0.15)
    expect(getIRRFRate(3000)).toBe(0.15)
    expect(getIRRFRate(3751.05)).toBe(0.15)
  })

  it('should return 0.225 for income in the fourth bracket (3751.06 to 4664.68)', () => {
    expect(getIRRFRate(3751.06)).toBe(0.225)
    expect(getIRRFRate(4000)).toBe(0.225)
    expect(getIRRFRate(4664.68)).toBe(0.225)
  })

  it('should return 0.275 for income in the fifth bracket (>= 4664.69)', () => {
    expect(getIRRFRate(4664.69)).toBe(0.275)
    expect(getIRRFRate(5000)).toBe(0.275)
    expect(getIRRFRate(10000)).toBe(0.275)
  })
})
