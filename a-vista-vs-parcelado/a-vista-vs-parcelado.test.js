/**
 * @jest-environment jsdom
 */
const { FinancialCalculator, Utils } = require('./a-vista-vs-parcelado.js')

describe('Utils', () => {
  describe('formatCurrencyInput', () => {
    it('should return empty string for falsy values', () => {
      expect(Utils.formatCurrencyInput('')).toBe('')
      expect(Utils.formatCurrencyInput(null)).toBe('')
      expect(Utils.formatCurrencyInput(undefined)).toBe('')
      expect(Utils.formatCurrencyInput(0)).toBe('')
    })

    it('should format numeric string values correctly', () => {
      // Space is a non-breaking space (U+00A0) in standard Intl.NumberFormat for pt-BR
      const nbsp = '\u00A0'
      expect(Utils.formatCurrencyInput('1234')).toBe(`R$${nbsp}1.234,00`)
      expect(Utils.formatCurrencyInput('1234,56')).toBe(`R$${nbsp}1.234,56`)
      expect(Utils.formatCurrencyInput('0,00')).toBe(`R$${nbsp}0,00`)
      expect(Utils.formatCurrencyInput('0')).toBe(`R$${nbsp}0,00`)
    })

    it('should format number values correctly', () => {
      const nbsp = '\u00A0'
      expect(Utils.formatCurrencyInput(1234.56)).toBe(`R$${nbsp}1.234,56`)
      expect(Utils.formatCurrencyInput(1234)).toBe(`R$${nbsp}1.234,00`)
    })

    it('should handle non-numeric inputs gracefully (returning formatted 0 for some strings, original value if parsing returns NaN)', () => {
      const nbsp = '\u00A0'
      expect(Utils.formatCurrencyInput('abc')).toBe(`R$${nbsp}0,00`)

      // when Utils.parseCurrencyInput returns NaN, Utils.formatCurrencyInput returns the original value.
      // We can force parseCurrencyInput to return NaN by passing something it can't handle or we can mock it.
      // Note: parseCurrencyInput('abc') returns 0, so numericValue is 0 (not NaN).
      // Let's mock parseCurrencyInput to simulate returning NaN.

      const parseSpy = jest.spyOn(Utils, 'parseCurrencyInput').mockReturnValue(NaN);
      try {
        expect(Utils.formatCurrencyInput('anything')).toBe('anything');
      } finally {
        parseSpy.mockRestore();
      }
    })
  })

  describe('parseCurrencyInput', () => {
    const { parseCurrencyInput } = Utils

    it('should correctly parse standard formatted strings', () => {
      expect(parseCurrencyInput('1234,56')).toBe(1234.56)
      expect(parseCurrencyInput('1.234,56')).toBe(1234.56)
      expect(parseCurrencyInput('1.234.567,89')).toBe(1234567.89)
    })

    it('should correctly parse strings with currency symbols and spaces', () => {
      expect(parseCurrencyInput('R$ 1.234,56')).toBe(1234.56)
      expect(parseCurrencyInput('R$1234,56')).toBe(1234.56)
      expect(parseCurrencyInput('  1234,56  ')).toBe(1234.56)
      expect(parseCurrencyInput('R$ 1.234.567,89')).toBe(1234567.89)
    })

    it('should correctly parse integer strings without decimals', () => {
      expect(parseCurrencyInput('1234')).toBe(1234)
      expect(parseCurrencyInput('R$ 1234')).toBe(1234)
      expect(parseCurrencyInput('1.234')).toBe(1234)
    })

    it('should handle zero values correctly', () => {
      expect(parseCurrencyInput('0')).toBe(0)
      expect(parseCurrencyInput('0,00')).toBe(0)
      expect(parseCurrencyInput('R$ 0,00')).toBe(0)
    })

    it('should return 0 for non-numeric string formats', () => {
      expect(parseCurrencyInput('abc')).toBe(0)
      expect(parseCurrencyInput('R$ abc')).toBe(0)
      expect(parseCurrencyInput('')).toBe(0)
      expect(parseCurrencyInput('   ')).toBe(0)
    })

    it('should return the original value if not a string', () => {
      expect(parseCurrencyInput(1234.56)).toBe(1234.56)
      expect(parseCurrencyInput(null)).toBeNull()
      expect(parseCurrencyInput(undefined)).toBeUndefined()
      const obj = {}
      expect(parseCurrencyInput(obj)).toBe(obj)
    })

    it('should correctly parse negative values', () => {
      expect(parseCurrencyInput('-1234,56')).toBe(-1234.56)
      expect(parseCurrencyInput('R$ -1.234,56')).toBe(-1234.56)
      expect(parseCurrencyInput('-0,50')).toBe(-0.5)
    })

    it('should strip multiple spaces and random spaces inside strings', () => {
      expect(parseCurrencyInput(' 1 2 3 , 4 5 ')).toBe(123.45)
      expect(parseCurrencyInput('R$   1.234  ,  56')).toBe(1234.56)
    })

    it('should handle small fractional values', () => {
      expect(parseCurrencyInput('0,0001')).toBe(0.0001)
      expect(parseCurrencyInput('R$ 0,0001')).toBe(0.0001)
    })

    it('should handle strings with multiple commas gracefully by dropping subsequent parts', () => {
      expect(parseCurrencyInput('1.234,56,78')).toBe(1234.56)
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

  describe('calculateCashCost', () => {
    const { calculateCashCost } = FinancialCalculator

    it('should correctly calculate costs and monthly rate with a standard SELIC rate', () => {
      // Mocking the context or using the actual this behavior from the object since it's just a method
      // In tests, if we extract `calculateCashCost` and call it directly, `this` might be undefined.
      // So we should call it on the object `FinancialCalculator.calculateCashCost`.

      const result = FinancialCalculator.calculateCashCost(900, 1000, 10.47, 12)

      expect(result.cashPayment).toBe(900)
      expect(result.effectiveCost).toBe(900)
      // monthlyRate of 10.47% approx 0.0083323
      expect(result.monthlyRate).toBeCloseTo(0.0083323, 6)
    })

    it('should correctly handle a 0 SELIC rate', () => {
      const result = FinancialCalculator.calculateCashCost(1000, 1000, 0, 12)

      expect(result.cashPayment).toBe(1000)
      expect(result.effectiveCost).toBe(1000)
      expect(result.monthlyRate).toBe(0)
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
})
