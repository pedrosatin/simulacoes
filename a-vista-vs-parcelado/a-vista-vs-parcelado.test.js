/**
 * @jest-environment jsdom
 */
const { FinancialCalculator, Utils } = require('./a-vista-vs-parcelado.js')

describe('Utils', () => {
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

  describe('compareOptions', () => {
    // Preserve `this` binding by calling directly on FinancialCalculator or binding it
    it('should recommend cash payment when cash cost is lower', () => {
      const cashResult = { effectiveCost: 900 }
      const installmentResult = { effectiveCost: 1000 }
      const productValue = 1000
      const installments = 10

      // FinancialCalculator.compareOptions calls this.generateRecommendation
      const result = FinancialCalculator.compareOptions(
        cashResult,
        installmentResult,
        productValue,
        installments,
      )

      expect(result.isCashBetter).toBe(true)
      expect(result.savings).toBe(100)
      expect(result.savingsPercent).toBeCloseTo(11.11, 2)
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
      expect(result.savingsPercent).toBeCloseTo(10.0, 2)
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

      expect(result.isCashBetter).toBe(false)
      expect(result.savings).toBe(0)
      expect(result.savingsPercent).toBe(0)
      expect(result.recommendation).toContain(
        'Parcelar é ligeiramente melhor, mas a diferença é pequena',
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
      expect(result.savingsPercent).toBeCloseTo(1.01, 2)
      expect(result.recommendation).toContain(
        'Comprar à vista é ligeiramente melhor, mas a diferença é pequena',
      )
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
