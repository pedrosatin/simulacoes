const {
  calculateINSS,
  getINSSRate,
  calculateNetSalary,
  calculateIRRF,
  getIRRFRate,
  validateTransportVoucher,
} = require('./salario-liquido')

describe('getINSSRate', () => {
  it('should return 0.075 for salary in the first bracket (0 to 1621.00)', () => {
    expect(getINSSRate(0)).toBe(0.075)
    expect(getINSSRate(1000)).toBe(0.075)
    expect(getINSSRate(1621.0)).toBe(0.075)
  })

  it('should return 0.09 for salary in the second bracket (1621.01 to 2902.84)', () => {
    expect(getINSSRate(1621.01)).toBe(0.09)
    expect(getINSSRate(2000)).toBe(0.09)
    expect(getINSSRate(2902.84)).toBe(0.09)
  })

  it('should return 0.12 for salary in the third bracket (2902.85 to 4354.27)', () => {
    expect(getINSSRate(2902.85)).toBe(0.12)
    expect(getINSSRate(3000)).toBe(0.12)
    expect(getINSSRate(4354.27)).toBe(0.12)
  })

  it('should return 0.14 for salary in the fourth bracket (4354.28 and above)', () => {
    expect(getINSSRate(4354.28)).toBe(0.14)
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

  it('should return 0 for non-numeric string inputs', () => {
    expect(getINSSRate('1000')).toBe(0)
    expect(getINSSRate('invalid')).toBe(0)
  })

  it('should return correct rates for very large numbers', () => {
    expect(getINSSRate(1000000)).toBe(0.14)
    expect(getINSSRate(Number.MAX_SAFE_INTEGER)).toBe(0.14)
  })
})

describe('calculateINSS', () => {
  it('should calculate INSS for salary within the first bracket', () => {
    // 0 to 1621.00 @ 7.5%
    // 1621.00 * 0.075 = 121.575
    const inss = calculateINSS(1621.0)
    expect(inss.value).toBeCloseTo(121.575, 2)
  })

  it('should calculate INSS for salary within the second bracket', () => {
    // B1: 1621.00 * 0.075 = 121.575
    // B2: (2000.00 - 1621.01) * 0.09 = 378.99 * 0.09 = 34.1091
    // Total: 155.6841
    const inss = calculateINSS(2000.0)
    expect(inss.value).toBeCloseTo(155.6841, 4)
  })

  it('should calculate INSS for salary within the third bracket', () => {
    // B1: 121.575
    // B2: 1281.84 * 0.09 = 115.3656 (faixa cheia)
    // B3: (3000.00 - 2902.85) * 0.12 = 97.15 * 0.12 = 11.658
    // Total: 248.5986
    const inss = calculateINSS(3000.0)
    expect(inss.value).toBeCloseTo(248.5986, 4)
  })

  it('should calculate INSS for salary within the fourth bracket', () => {
    // B1: 121.575 | B2: 115.3656 | B3: 1451.43 * 0.12 = 174.1716 (faixa cheia)
    // B4: (5000.00 - 4354.28) * 0.14 = 645.72 * 0.14 = 90.4008
    // Total: 501.513
    const inss = calculateINSS(5000.0)
    expect(inss.value).toBeCloseTo(501.513, 3)
  })

  it('should cap INSS calculation to the progressive ceiling', () => {
    // A contribuicao maxima e a soma progressiva das faixas, nao 14% do teto:
    // B1: 1621.00 * 0.075 = 121.575
    // B2: (2902.84 - 1621.00) * 0.09 = 115.3656
    // B3: (4354.27 - 2902.84) * 0.12 = 174.1716
    // B4: (8475.55 - 4354.27) * 0.14 = 576.9792
    // Total = 988.0914
    const ceiling = 988.0914
    expect(calculateINSS(10000.0).value).toBeCloseTo(ceiling, 4)
    expect(calculateINSS(50000.0).value).toBeCloseTo(ceiling, 4)
    // No teto exato o laco cobre a faixa 4 a partir de 4354.28 (1 centavo a menos)
    expect(calculateINSS(8475.55).value).toBeCloseTo(ceiling, 2)
  })

  it('should return 0 for 0 salary', () => {
    const inss = calculateINSS(0)
    expect(inss.value).toBe(0)
  })

  it('should return 0 for negative salary', () => {
    const inss = calculateINSS(-1000)
    expect(inss.value).toBe(0)
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

  it('should return 0 for negative transport value', () => {
    const result = validateTransportVoucher(-50, 2000)
    expect(result).toBe(0)
  })

  it('should return 0 for negative gross salary', () => {
    const result = validateTransportVoucher(100, -2000)
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
    // INSS: 248.5986
    // IRRF Base: 3000 - 248.5986 = 2751.4014
    // IRRF Bracket: 2259.21 a 2826.65 @ 7.5% com deducao de 169.44
    // IRRF Value: (2751.4014 * 0.075) - 169.44 = 36.915105
    // Total Deductions = 248.5986 + 36.915105 = 285.513705
    // Net Salary: 3000 - 285.513705 = 2714.486295
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
    expect(result.inss.value).toBeCloseTo(248.5986, 4)
    expect(result.irrf.value).toBeCloseTo(36.9151, 4)
    expect(result.netSalary).toBeCloseTo(2714.4863, 4)
    expect(result.hasOptionalDeductions).toBe(false)
  })

  it('should calculate net salary correctly with dependents', () => {
    // 3000 gross salary, 2 dependentes
    // INSS: 248.5986
    // Dependentes: 2 * 189.59 = 379.18
    // IRRF Base: 3000 - 248.5986 - 379.18 = 2372.2214
    // IRRF Value: (2372.2214 * 0.075) - 169.44 = 8.476605
    // Net Salary: 3000 - 248.5986 - 8.476605 = 2742.924795
    const data = {
      grossSalary: 3000,
      dependents: 2,
      healthPlan: 0,
      mealVoucher: 0,
      transportVoucher: 0,
      otherDeductions: 0,
    }

    const result = calculateNetSalary(data)

    expect(result.irrf.value).toBeCloseTo(8.4766, 4)
    expect(result.netSalary).toBeCloseTo(2742.9248, 4)
  })

  it('should calculate net salary with optional deductions', () => {
    // 5000 gross salary, plano 200, refeicao 50, outros 100
    // INSS: 501.513
    // IRRF Base: 5000 - 501.513 - 200 = 4298.487
    // IRRF Bracket: 3751.06 a 4664.68 @ 22.5% com deducao de 662.77
    // IRRF Value: (4298.487 * 0.225) - 662.77 = 304.389575
    // Total Optional = 350
    // Total Deductions = 501.513 + 304.389575 + 350 = 1155.902575
    // Net Salary: 5000 - 1155.902575 = 3844.097425
    const data = {
      grossSalary: 5000,
      dependents: 0,
      healthPlan: 200,
      mealVoucher: 50,
      transportVoucher: 0,
      otherDeductions: 100,
    }

    const result = calculateNetSalary(data)

    expect(result.irrf.value).toBeCloseTo(304.3896, 4)
    expect(result.optional.total).toBe(350)
    expect(result.totalDeductions).toBeCloseTo(1155.9026, 4)
    expect(result.netSalary).toBeCloseTo(3844.0974, 4)
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

  it('should return 0 for invalid inputs like NaN', () => {
    expect(getIRRFRate(NaN)).toBe(0)
  })
})
