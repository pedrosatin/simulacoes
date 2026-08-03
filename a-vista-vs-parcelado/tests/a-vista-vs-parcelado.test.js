const {
  FinancialCalculator,
  SelicAPI,
  Utils,
} = require('../a-vista-vs-parcelado.js')

describe('Utils', () => {
  describe('parseCurrencyInput', () => {
    it('should correctly parse standard formatted strings', () => {
      expect(Utils.parseCurrencyInput('1234,56')).toBe(1234.56)
      expect(Utils.parseCurrencyInput('1.234,56')).toBe(1234.56)
      expect(Utils.parseCurrencyInput('1.234.567,89')).toBe(1234567.89)
    })

    it('should correctly parse strings with currency symbols and spaces', () => {
      expect(Utils.parseCurrencyInput('R$ 1.234,56')).toBe(1234.56)
      expect(Utils.parseCurrencyInput('R$1234,56')).toBe(1234.56)
      expect(Utils.parseCurrencyInput('  1234,56  ')).toBe(1234.56)
      expect(Utils.parseCurrencyInput('R$ 1.234.567,89')).toBe(1234567.89)
    })

    it('should correctly parse integer strings without decimals', () => {
      expect(Utils.parseCurrencyInput('1234')).toBe(1234)
      expect(Utils.parseCurrencyInput('R$ 1234')).toBe(1234)
      expect(Utils.parseCurrencyInput('1.234')).toBe(1234)
    })

    it('should handle zero values correctly', () => {
      expect(Utils.parseCurrencyInput('0')).toBe(0)
      expect(Utils.parseCurrencyInput('0,00')).toBe(0)
      expect(Utils.parseCurrencyInput('R$ 0,00')).toBe(0)
    })

    it('should return 0 for non-numeric string formats', () => {
      expect(Utils.parseCurrencyInput('abc')).toBe(0)
      expect(Utils.parseCurrencyInput('R$ abc')).toBe(0)
      expect(Utils.parseCurrencyInput('')).toBe(0)
      expect(Utils.parseCurrencyInput('   ')).toBe(0)
    })

    it('should return the original value if not a string', () => {
      expect(Utils.parseCurrencyInput(1234.56)).toBe(1234.56)
      expect(Utils.parseCurrencyInput(null)).toBeNull()
      expect(Utils.parseCurrencyInput(undefined)).toBeUndefined()
      const obj = {}
      expect(Utils.parseCurrencyInput(obj)).toBe(obj)
    })

    it('should correctly parse negative values', () => {
      expect(Utils.parseCurrencyInput('-1234,56')).toBe(-1234.56)
      expect(Utils.parseCurrencyInput('R$ -1.234,56')).toBe(-1234.56)
      expect(Utils.parseCurrencyInput('-0,50')).toBe(-0.5)
    })

    it('should strip multiple spaces and random spaces inside strings', () => {
      expect(Utils.parseCurrencyInput(' 1 2 3 , 4 5 ')).toBe(123.45)
      expect(Utils.parseCurrencyInput('R$   1.234  ,  56')).toBe(1234.56)
    })

    it('should handle small fractional values', () => {
      expect(Utils.parseCurrencyInput('0,0001')).toBe(0.0001)
      expect(Utils.parseCurrencyInput('R$ 0,0001')).toBe(0.0001)
    })

    it('should handle strings with multiple commas gracefully by dropping subsequent parts', () => {
      expect(Utils.parseCurrencyInput('1.234,56,78')).toBe(1234.56)
    })
  })

  describe('formatCurrencyInput', () => {
    it('should return empty string for falsy values', () => {
      expect(Utils.formatCurrencyInput('')).toBe('')
      expect(Utils.formatCurrencyInput(null)).toBe('')
      expect(Utils.formatCurrencyInput(undefined)).toBe('')
      expect(Utils.formatCurrencyInput(0)).toBe('')
    })

    it('should format numeric string values correctly', () => {
      const nbsp = ' '
      expect(Utils.formatCurrencyInput('1234')).toBe(`R$${nbsp}1.234,00`)
      expect(Utils.formatCurrencyInput('1234,56')).toBe(`R$${nbsp}1.234,56`)
      expect(Utils.formatCurrencyInput('0,00')).toBe(`R$${nbsp}0,00`)
      expect(Utils.formatCurrencyInput('0')).toBe(`R$${nbsp}0,00`)
    })

    it('should format number values correctly', () => {
      const nbsp = ' '
      expect(Utils.formatCurrencyInput(1234.56)).toBe(`R$${nbsp}1.234,56`)
      expect(Utils.formatCurrencyInput(1234)).toBe(`R$${nbsp}1.234,00`)
    })

    it('should handle non-numeric inputs gracefully', () => {
      const nbsp = ' '
      expect(Utils.formatCurrencyInput('abc')).toBe(`R$${nbsp}0,00`)

      const parseSpy = jest
        .spyOn(Utils, 'parseCurrencyInput')
        .mockReturnValue(NaN)
      try {
        expect(Utils.formatCurrencyInput('anything')).toBe('anything')
      } finally {
        parseSpy.mockRestore()
      }
    })
  })
})

describe('FinancialCalculator', () => {
  describe('annualToMonthlyRate', () => {
    const { annualToMonthlyRate } = FinancialCalculator

    it('should correctly convert 0% annual rate to 0% monthly rate', () => {
      expect(annualToMonthlyRate(0)).toBeCloseTo(0, 10)
    })

    it('should correctly convert 100% annual rate to ~5.946% monthly rate', () => {
      // (1 + 100/100)^(1/12) - 1 = 2^(1/12) - 1 ≈ 0.059463
      expect(annualToMonthlyRate(100)).toBeCloseTo(0.059463, 6)
    })

    it('should correctly convert a typical Selic rate (e.g. 10.47%) to a monthly rate', () => {
      // (1 + 10.47/100)^(1/12) - 1 ≈ 0.0083323...
      expect(annualToMonthlyRate(10.47)).toBeCloseTo(0.0083323, 6)
    })

    it('should correctly convert a negative annual rate', () => {
      // (1 + -10/100)^(1/12) - 1 = 0.9^(1/12) - 1 ≈ -0.0087416...
      expect(annualToMonthlyRate(-10)).toBeCloseTo(-0.0087416, 6)
    })
  })

  describe('generateRecommendation', () => {
    const { generateRecommendation } = FinancialCalculator

    it('should return correct recommendation when cash is better and savings > 10%', () => {
      const savings = 500
      const expectedText = `Comprar à vista é muito mais vantajoso! Você economizará ${Utils.formatCurrency(savings)} investindo a diferença na Selic durante 12 meses.`
      expect(generateRecommendation(true, savings, 11, 12)).toBe(expectedText)
    })

    it('should return correct recommendation when cash is better and 5% < savings <= 10%', () => {
      const savings = 300
      const expectedText = `Comprar à vista é mais vantajoso. A economia de ${Utils.formatCurrency(savings)} compensa o investimento na Selic.`
      expect(generateRecommendation(true, savings, 8, 12)).toBe(expectedText)
    })

    it('should return correct recommendation when cash is better and savings <= 5%', () => {
      const savings = 100
      const expectedText = `Comprar à vista é ligeiramente melhor, mas a diferença é pequena (${Utils.formatCurrency(savings)}). Considere sua disponibilidade de caixa.`
      expect(generateRecommendation(true, savings, 4, 12)).toBe(expectedText)
    })

    it('should return correct recommendation when installment is better and savings > 10%', () => {
      const savings = 600
      const expectedText = `Parcelar é muito mais vantajoso! Você terá ${Utils.formatCurrency(savings)} a mais investindo na Selic ao invés de pagar à vista.`
      expect(generateRecommendation(false, savings, 12, 12)).toBe(expectedText)
    })

    it('should return correct recommendation when installment is better and 5% < savings <= 10%', () => {
      const savings = 350
      const expectedText = `Parcelar é mais vantajoso. Você ganha ${Utils.formatCurrency(savings)} a mais mantendo o dinheiro investido.`
      expect(generateRecommendation(false, savings, 7, 12)).toBe(expectedText)
    })

    it('should return correct recommendation when installment is better and savings <= 5%', () => {
      const savings = 150
      const expectedText = `Parcelar é ligeiramente melhor, mas a diferença é pequena (${Utils.formatCurrency(savings)}). Avalie sua preferência pessoal.`
      expect(generateRecommendation(false, savings, 2, 12)).toBe(expectedText)
    })
  })

  describe('calculateCompoundInterest', () => {
    it('should correctly calculate compound interest for basic values', () => {
      // principal: 1000, monthlyRate: 1% (0.01), months: 12
      // expected: 1000 * (1.01)^12 ≈ 1126.825
      const principal = 1000
      const monthlyRate = 0.01
      const months = 12
      // oxlint-disable-next-line no-loss-of-precision -- exact f64 expected value
      const expected = 1126.8250301319698

      const result = FinancialCalculator.calculateCompoundInterest(
        principal,
        monthlyRate,
        months,
      )
      expect(result).toBeCloseTo(expected, 5)
    })

    it('should return the principal if months is 0', () => {
      const principal = 500
      const monthlyRate = 0.05
      const months = 0

      const result = FinancialCalculator.calculateCompoundInterest(
        principal,
        monthlyRate,
        months,
      )
      expect(result).toBe(principal)
    })

    it('should return the principal if rate is 0', () => {
      const principal = 1500
      const monthlyRate = 0
      const months = 24

      const result = FinancialCalculator.calculateCompoundInterest(
        principal,
        monthlyRate,
        months,
      )
      expect(result).toBe(principal)
    })

    it('should return 0 if principal is 0', () => {
      const principal = 0
      const monthlyRate = 0.1
      const months = 5

      const result = FinancialCalculator.calculateCompoundInterest(
        principal,
        monthlyRate,
        months,
      )
      expect(result).toBe(0)
    })

    it('should handle fractional months properly', () => {
      // Though rare in typical usage, it's mathematically sound
      const principal = 1000
      const monthlyRate = 0.02
      const months = 6.5 // half a month

      const expected = 1000 * Math.pow(1.02, 6.5)
      const result = FinancialCalculator.calculateCompoundInterest(
        principal,
        monthlyRate,
        months,
      )
      expect(result).toBeCloseTo(expected, 5)
    })
  })

  describe('calculateCashCost', () => {
    it('should correctly calculate cash cost for typical values', () => {
      const cashValue = 1000
      const productValue = 1200
      const selicRate = 10.47
      const installments = 12

      const result = FinancialCalculator.calculateCashCost(
        cashValue,
        productValue,
        selicRate,
        installments,
      )

      const expectedMonthlyRate =
        FinancialCalculator.annualToMonthlyRate(selicRate)

      expect(result.cashPayment).toBe(1000)
      expect(result.effectiveCost).toBe(1000)
      expect(result.monthlyRate).toBe(expectedMonthlyRate)
    })

    it('should calculate correctly when Selic rate is 0%', () => {
      const cashValue = 500
      const productValue = 500
      const selicRate = 0
      const installments = 10

      const result = FinancialCalculator.calculateCashCost(
        cashValue,
        productValue,
        selicRate,
        installments,
      )

      const expectedMonthlyRate = FinancialCalculator.annualToMonthlyRate(0)

      expect(result.cashPayment).toBe(500)
      expect(result.effectiveCost).toBe(500)
      expect(result.monthlyRate).toBe(expectedMonthlyRate)
    })
  })

  describe('calculateInstallmentCost', () => {
    it('should calculate installment cost correctly for typical values', () => {
      const productValue = 1200
      const cashValue = 1000
      const selicRate = 10.47
      const installments = 12

      const result = FinancialCalculator.calculateInstallmentCost(
        productValue,
        cashValue,
        selicRate,
        installments,
      )

      expect(result.installmentValue).toBe(100)
      expect(result.totalCost).toBe(1200)

      // Calculate expected manually:
      const monthlyRate = FinancialCalculator.annualToMonthlyRate(selicRate)

      let expectedPresentValue = 0
      let currentDiscountFactor = 1 + monthlyRate
      for (let month = 1; month <= installments; month++) {
        expectedPresentValue += 100 / currentDiscountFactor
        currentDiscountFactor *= 1 + monthlyRate
      }

      const averagePeriod = 6 // 12 / 2
      const selicReturn = cashValue * Math.pow(1 + monthlyRate, averagePeriod)
      const opportunityCost = selicReturn - cashValue

      expect(result.effectiveCost).toBeCloseTo(expectedPresentValue, 5)
      expect(result.selicReturn).toBeCloseTo(selicReturn, 5)
      expect(result.opportunityCost).toBeCloseTo(opportunityCost, 5)
      expect(result.presentValueOfInstallments).toBeCloseTo(
        expectedPresentValue,
        5,
      )
    })

    it('should calculate correctly when Selic rate is 0%', () => {
      const productValue = 1200
      const cashValue = 1000
      const selicRate = 0
      const installments = 12

      const result = FinancialCalculator.calculateInstallmentCost(
        productValue,
        cashValue,
        selicRate,
        installments,
      )

      expect(result.installmentValue).toBe(100)
      expect(result.totalCost).toBe(1200)
      expect(result.effectiveCost).toBe(1200)
      expect(result.selicReturn).toBe(1000)
      expect(result.opportunityCost).toBe(0)
      expect(result.presentValueOfInstallments).toBe(1200)
    })

    it('should calculate correctly for a single installment', () => {
      const productValue = 500
      const cashValue = 450
      const selicRate = 10.47
      const installments = 1

      const result = FinancialCalculator.calculateInstallmentCost(
        productValue,
        cashValue,
        selicRate,
        installments,
      )

      expect(result.installmentValue).toBe(500)
      expect(result.totalCost).toBe(500)

      const monthlyRate = FinancialCalculator.annualToMonthlyRate(selicRate)

      // 1 installment means it's paid in month 1
      const expectedPresentValue = 500 / (1 + monthlyRate)

      const averagePeriod = 0.5 // 1 / 2
      const selicReturn = cashValue * Math.pow(1 + monthlyRate, averagePeriod)
      const opportunityCost = selicReturn - cashValue

      expect(result.effectiveCost).toBeCloseTo(expectedPresentValue, 5)
      expect(result.selicReturn).toBeCloseTo(selicReturn, 5)
      expect(result.opportunityCost).toBeCloseTo(opportunityCost, 5)
      expect(result.presentValueOfInstallments).toBeCloseTo(
        expectedPresentValue,
        5,
      )
    })
  })

  describe('compareOptions', () => {
    it('should recommend cash payment when cash cost is lower', () => {
      const cashResult = { effectiveCost: 900 }
      const installmentResult = { effectiveCost: 1000 }
      const productValue = 1000
      const installments = 10

      const result = FinancialCalculator.compareOptions(
        cashResult,
        installmentResult,
        productValue,
        installments,
      )

      expect(result.isCashBetter).toBe(true)
      expect(result.savings).toBe(100)
      expect(result.savingsPercent).toBeCloseTo(11.11, 2) // (100 / 900) * 100
      expect(result.recommendation).toContain(
        'Comprar à vista é muito mais vantajoso!',
      )
    })

    it('should recommend installment payment when installment cost is lower', () => {
      const cashResult = { effectiveCost: 1100 }
      const installmentResult = { effectiveCost: 1000 }
      const productValue = 1200
      const installments = 12

      const result = FinancialCalculator.compareOptions(
        cashResult,
        installmentResult,
        productValue,
        installments,
      )

      expect(result.isCashBetter).toBe(false)
      expect(result.savings).toBe(100)
      expect(result.savingsPercent).toBeCloseTo(10.0, 2) // (100 / 1000) * 100 -> exactly 10, not > 10
      expect(result.recommendation).toContain('Parcelar é mais vantajoso')
    })

    it('should calculate correctly when costs are equal', () => {
      const cashResult = { effectiveCost: 1000 }
      const installmentResult = { effectiveCost: 1000 }
      const productValue = 1000
      const installments = 5

      const result = FinancialCalculator.compareOptions(
        cashResult,
        installmentResult,
        productValue,
        installments,
      )

      expect(result.isCashBetter).toBe(false) // cashCost < installmentCost is false
      expect(result.savings).toBe(0)
      expect(result.savingsPercent).toBe(0)
      expect(result.recommendation).toContain(
        'Parcelar é ligeiramente melhor, mas a diferença é pequena (R$ 0,00)',
      )
    })

    it('should handle small differences for cash advantage', () => {
      const cashResult = { effectiveCost: 990 }
      const installmentResult = { effectiveCost: 1000 }
      const productValue = 1000
      const installments = 5

      const result = FinancialCalculator.compareOptions(
        cashResult,
        installmentResult,
        productValue,
        installments,
      )

      expect(result.isCashBetter).toBe(true)
      expect(result.savings).toBe(10)
      expect(result.savingsPercent).toBeCloseTo(1.01, 2) // (10 / 990) * 100
      expect(result.recommendation).toContain(
        'Comprar à vista é ligeiramente melhor, mas a diferença é pequena (R$ 10,00)',
      )
    })
  })
})

describe('SelicAPI', () => {
  describe('getSelicRate', () => {
    let originalFetch
    let consoleWarnSpy
    let isCacheValidSpy

    beforeEach(() => {
      originalFetch = global.fetch
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      isCacheValidSpy = jest
        .spyOn(SelicAPI, 'isCacheValid')
        .mockReturnValue(false)
    })

    afterEach(() => {
      global.fetch = originalFetch
      consoleWarnSpy.mockRestore()
      isCacheValidSpy.mockRestore()
    })

    const getFormattedToday = () => {
      const today = new Date()
      return `${today.getDate().toString().padStart(2, '0')}/${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}/${today.getFullYear()}`
    }

    it('should return cached rate if cache is valid', async () => {
      // First, set the mock to false to allow the cache to be populated
      isCacheValidSpy.mockReturnValue(false)

      // Mock successful fetch to set up the cache
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ valor: '10.5', data: '01/01/2023' }]),
        })
      )

      // First call (cache is invalid) - it will fetch and set cache
      const firstResult = await SelicAPI.getSelicRate()

      // Now change the mock so next call thinks cache is valid
      isCacheValidSpy.mockReturnValue(true)

      // Change fetch mock to reject, so if it tries to fetch it will fail
      global.fetch = jest.fn(() => Promise.reject(new Error('Should not be called')))

      // Second call (cache is valid)
      const cachedResult = await SelicAPI.getSelicRate()

      expect(cachedResult).toEqual({
        rate: 10.5,
        date: '01/01/2023',
      })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should fetch and return rate from API successfully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ valor: '11.25', data: '15/05/2023' }]),
        })
      )

      const result = await SelicAPI.getSelicRate()

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(Object),
        })
      )
      expect(result.rate).toBe(11.25)
      expect(result.date).toBe('15/05/2023')
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should use fallback rate when API returns invalid rate (NaN)', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ valor: 'not-a-number', data: '01/01/2023' }]),
        })
      )

      const result = await SelicAPI.getSelicRate()

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Erro ao buscar taxa Selic:',
        'Taxa Selic inválida recebida da API'
      )
      expect(result.rate).toBe(15.0)
      expect(result.date).toBe(getFormattedToday())
    })

    it('should use fallback rate when API fetch fails', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))

      const result = await SelicAPI.getSelicRate()

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Erro ao buscar taxa Selic:',
        'Network error',
      )
      expect(result.rate).toBe(15.0)
      expect(result.date).toBe(getFormattedToday())
    })

    it('should use fallback rate when API returns non-ok response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        }),
      )

      const result = await SelicAPI.getSelicRate()

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Erro ao buscar taxa Selic:',
        'HTTP 500: Internal Server Error',
      )
      expect(result.rate).toBe(15.0)
      expect(result.date).toBe(getFormattedToday())
    })

    it('should use fallback rate when API returns invalid data format', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ notAnArray: true }),
        }),
      )

      const result = await SelicAPI.getSelicRate()

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Erro ao buscar taxa Selic:',
        'Dados inválidos recebidos da API',
      )
      expect(result.rate).toBe(15.0)
      expect(result.date).toBe(getFormattedToday())
    })
  })

  describe('updateSelicDisplay', () => {
    let consoleErrorSpy
    let getSelicRateSpy

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      document.getElementById('selicRate').textContent = ''
      document.getElementById('selicDate').textContent = ''
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
      if (getSelicRateSpy) {
        getSelicRateSpy.mockRestore()
      }
    })

    it('should update display with API rate on success', async () => {
      getSelicRateSpy = jest.spyOn(SelicAPI, 'getSelicRate').mockResolvedValue({
        rate: 10.5,
        date: '10/05/2024'
      })

      const updatePromise = SelicAPI.updateSelicDisplay()

      // Before promise resolves, should show loading
      expect(document.getElementById('selicRate').textContent).toBe('Carregando...')
      expect(document.getElementById('selicDate').textContent).toBe('')

      await updatePromise

      expect(document.getElementById('selicRate').textContent).toBe('10.50% a.a.')
      // updateSelicDisplay does not set selicDate on success
      expect(document.getElementById('selicDate').textContent).toBe('')
    })

    it('should update display with fallback rate on error', async () => {
      getSelicRateSpy = jest.spyOn(SelicAPI, 'getSelicRate').mockRejectedValue(new Error('API failure'))

      const updatePromise = SelicAPI.updateSelicDisplay()

      // Before promise resolves, should show loading
      expect(document.getElementById('selicRate').textContent).toBe('Carregando...')
      expect(document.getElementById('selicDate').textContent).toBe('')

      await updatePromise

      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao atualizar display da Selic:', expect.any(Error))

      expect(document.getElementById('selicRate').textContent).toBe('15.00% a.a.')
      expect(document.getElementById('selicDate').textContent).toBe('Taxa de referência')
    })
  })
})
