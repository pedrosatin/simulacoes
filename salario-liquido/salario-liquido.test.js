const {
  calculateINSS,
  getINSSRate,
  calculateNetSalary,
  calculateIRRF,
  calculateProgressiveIRRF,
  calculateIRRFReduction,
  calculateIRRFBase,
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

describe('calculateProgressiveIRRF', () => {
  it('should return 0 within the exempt bracket (up to 2428.80)', () => {
    expect(calculateProgressiveIRRF(0)).toBe(0)
    expect(calculateProgressiveIRRF(2000)).toBe(0)
    expect(calculateProgressiveIRRF(2428.8)).toBe(0)
  })

  it('should apply each bracket rate and deduction', () => {
    // 2428.81 * 0.075 - 182.16 = 0.00075
    expect(calculateProgressiveIRRF(2428.81)).toBeCloseTo(0.00075, 5)
    // 3000 * 0.15 - 394.16 = 55.84
    expect(calculateProgressiveIRRF(3000)).toBeCloseTo(55.84, 2)
    // 4000 * 0.225 - 675.49 = 224.51
    expect(calculateProgressiveIRRF(4000)).toBeCloseTo(224.51, 2)
    // 5000 * 0.275 - 908.73 = 466.27
    expect(calculateProgressiveIRRF(5000)).toBeCloseTo(466.27, 2)
  })

  it('should return 0 for invalid or negative input', () => {
    expect(calculateProgressiveIRRF(-1000)).toBe(0)
    expect(calculateProgressiveIRRF(NaN)).toBe(0)
    expect(calculateProgressiveIRRF('invalid')).toBe(0)
  })
})

describe('calculateIRRFReduction', () => {
  it('should follow the formula 978.62 - 0.133145 * income', () => {
    expect(calculateIRRFReduction(5000)).toBeCloseTo(312.895, 3)
    expect(calculateIRRFReduction(6000)).toBeCloseTo(179.75, 2)
  })

  it('should reach approximately zero at the upper limit of 7350.00', () => {
    expect(calculateIRRFReduction(7350)).toBeCloseTo(0, 2)
  })

  it('should never be negative', () => {
    expect(calculateIRRFReduction(20000)).toBe(0)
  })
})

describe('calculateIRRF (Lei 15.270/2025)', () => {
  describe('band 1 — full exemption up to gross income of 5000.00', () => {
    it('should return 0 even when the progressive table would charge tax', () => {
      // Base 4392.80 cairia na faixa de 22.5%, mas o bruto esta na isencao total
      expect(calculateProgressiveIRRF(4392.8)).toBeGreaterThan(0)
      expect(calculateIRRF(4392.8, 5000.0)).toBe(0)
      expect(calculateIRRF(4392.8, 3000.0)).toBe(0)
    })

    it('should return 0 at the exact boundary of 5000.00', () => {
      expect(calculateIRRF(4392.8, 5000.0)).toBe(0)
    })
  })

  describe('band 2 — decreasing reduction from 5000.01 to 7350.00', () => {
    it('should stay continuous just past the exemption boundary', () => {
      // progressivo(4392.81) = 312.89225 | redutor(5000.01) = 312.893669
      // O redutor foi calibrado para anular o imposto no inicio da banda:
      // nao ha salto de imposto entre 5000.00 e 5000.01.
      expect(calculateIRRF(4392.81, 5000.01)).toBe(0)
    })

    it('should subtract the reduction in the middle of the band', () => {
      // progressivo(5000) = 466.27 | redutor(6000) = 179.75
      expect(calculateIRRF(5000, 6000)).toBeCloseTo(286.52, 2)
    })

    it('should be nearly the full progressive tax at 7350.00', () => {
      // redutor(7350) ~ 0.00425
      expect(calculateIRRF(6000, 7350)).toBeCloseTo(
        calculateProgressiveIRRF(6000) - 0.00425,
        4,
      )
    })

    it('should never go below zero', () => {
      // Redutor maior que o imposto apurado
      expect(calculateIRRF(2429, 5000.01)).toBe(0)
    })
  })

  describe('band 3 — full progressive table above 7350.01', () => {
    it('should apply the progressive tax with no reduction', () => {
      expect(calculateIRRF(6000, 7350.01)).toBeCloseTo(
        calculateProgressiveIRRF(6000),
        6,
      )
      expect(calculateIRRF(9000, 12000)).toBeCloseTo(
        calculateProgressiveIRRF(9000),
        6,
      )
    })
  })

  describe('edge cases', () => {
    it('should return 0 when the base is in the exempt bracket', () => {
      expect(calculateIRRF(2000, 20000)).toBe(0)
      expect(calculateIRRF(2428.8, 20000)).toBe(0)
    })

    it('should return 0 for 0, negative, NaN and non-numeric input', () => {
      expect(calculateIRRF(0, 0)).toBe(0)
      expect(calculateIRRF(-1000, -1000)).toBe(0)
      expect(calculateIRRF(NaN, NaN)).toBe(0)
      expect(calculateIRRF('invalid', 'invalid')).toBe(0)
    })

    it('should return Infinity for infinite income', () => {
      expect(calculateIRRF(Infinity, Infinity)).toBe(Infinity)
    })
  })
})

describe('calculateIRRFBase', () => {
  it('should subtract the legal deductions when they beat the simplified discount', () => {
    // 501.51 + 2 * 189.59 + 300 = 1180.69 > 607.20
    expect(calculateIRRFBase(5000, 501.51, 2, 300)).toBeCloseTo(3819.31, 2)
  })

  it('should subtract the simplified discount when it is more advantageous', () => {
    // Deducoes legais 248.60 < 607.20
    expect(calculateIRRFBase(3000, 248.5986, 0, 0)).toBeCloseTo(2392.8, 2)
  })
})

describe('calculateNetSalary', () => {
  it('should calculate net salary correctly without optional deductions', () => {
    // 3000 gross salary
    // INSS: 248.5986 | deducoes legais 248.5986 < 607.20 (simplificado vence)
    // IRRF Base: 3000 - 607.20 = 2392.80 -> faixa isenta
    // Bruto de 3000 tambem esta na isencao total da Lei 15.270/2025
    // Net Salary: 3000 - 248.5986 = 2751.4014
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
    expect(result.irrf.value).toBe(0)
    expect(result.irrf.rate).toBe(0)
    expect(result.netSalary).toBeCloseTo(2751.4014, 4)
    expect(result.hasOptionalDeductions).toBe(false)
  })

  it('should exempt any salary up to 5000.00', () => {
    const base = {
      dependents: 0,
      healthPlan: 0,
      mealVoucher: 0,
      transportVoucher: 0,
      otherDeductions: 0,
    }

    expect(
      calculateNetSalary({ ...base, grossSalary: 4999.99 }).irrf.value,
    ).toBe(0)
    expect(calculateNetSalary({ ...base, grossSalary: 5000 }).irrf.value).toBe(
      0,
    )
    // 5000 - INSS 501.513 = 4498.487
    expect(
      calculateNetSalary({ ...base, grossSalary: 5000 }).netSalary,
    ).toBeCloseTo(4498.487, 3)
  })

  it('should charge tax inside the reduction band', () => {
    // 6000 bruto | INSS 641.513 | base 6000 - 641.513 = 5358.487
    // progressivo: 5358.487 * 0.275 - 908.73 = 564.853925
    // redutor(6000) = 179.75 -> IRRF = 385.103925
    const result = calculateNetSalary({
      grossSalary: 6000,
      dependents: 0,
      healthPlan: 0,
      mealVoucher: 0,
      transportVoucher: 0,
      otherDeductions: 0,
    })

    expect(result.inss.value).toBeCloseTo(641.513, 3)
    expect(result.irrf.value).toBeCloseTo(385.1039, 4)
    expect(result.netSalary).toBeCloseTo(4973.3831, 4)
  })

  it('should apply the full progressive table above 7350.00', () => {
    // 10000 bruto | INSS no teto 988.0914 | base 10000 - 988.0914 = 9011.9086
    // 9011.9086 * 0.275 - 908.73 = 1569.544865, sem redutor
    const result = calculateNetSalary({
      grossSalary: 10000,
      dependents: 0,
      healthPlan: 0,
      mealVoucher: 0,
      transportVoucher: 0,
      otherDeductions: 0,
    })

    expect(result.inss.value).toBeCloseTo(988.0914, 4)
    expect(result.irrf.value).toBeCloseTo(1569.5449, 4)
    expect(result.irrf.rate).toBe(0.275)
    expect(result.netSalary).toBeCloseTo(7442.3637, 4)
  })

  it('should calculate net salary with optional deductions', () => {
    // 5000 bruto, plano 200, refeicao 50, outros 100
    // Bruto na isencao total -> IRRF 0
    // Total Deductions = 501.513 + 0 + 350 = 851.513
    const data = {
      grossSalary: 5000,
      dependents: 0,
      healthPlan: 200,
      mealVoucher: 50,
      transportVoucher: 0,
      otherDeductions: 100,
    }

    const result = calculateNetSalary(data)

    expect(result.irrf.value).toBe(0)
    expect(result.optional.total).toBe(350)
    expect(result.totalDeductions).toBeCloseTo(851.513, 3)
    expect(result.netSalary).toBeCloseTo(4148.487, 3)
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
  it('should return 0 when the base is in the exempt bracket', () => {
    expect(getIRRFRate(2428.8, 20000)).toBe(0)
    expect(getIRRFRate(1000, 20000)).toBe(0)
    expect(getIRRFRate(0, 0)).toBe(0)
    expect(getIRRFRate(-500, -500)).toBe(0)
  })

  it('should return 0 when the Lei 15.270/2025 reduction zeroes the tax', () => {
    // A base cairia em 22.5%, mas o bruto esta na isencao total
    expect(getIRRFRate(4392.8, 5000)).toBe(0)
  })

  it('should return the bracket rate when tax is actually due', () => {
    expect(getIRRFRate(2500, 20000)).toBe(0.075)
    expect(getIRRFRate(3000, 20000)).toBe(0.15)
    expect(getIRRFRate(4000, 20000)).toBe(0.225)
    expect(getIRRFRate(5000, 20000)).toBe(0.275)
  })

  it('should honour the bracket boundaries', () => {
    expect(getIRRFRate(2826.65, 20000)).toBe(0.075)
    expect(getIRRFRate(2826.66, 20000)).toBe(0.15)
    expect(getIRRFRate(3751.05, 20000)).toBe(0.15)
    expect(getIRRFRate(3751.06, 20000)).toBe(0.225)
    expect(getIRRFRate(4664.68, 20000)).toBe(0.225)
    expect(getIRRFRate(4664.69, 20000)).toBe(0.275)
  })

  it('should return 0 for invalid inputs like NaN', () => {
    expect(getIRRFRate(NaN, NaN)).toBe(0)
  })
})
