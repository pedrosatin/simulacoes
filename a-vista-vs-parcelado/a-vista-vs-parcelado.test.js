/**
 * @jest-environment jsdom
 */
const { FinancialCalculator, Utils } = require('./a-vista-vs-parcelado.js');

describe('Utils', () => {
  describe('parseCurrencyInput', () => {
    const { parseCurrencyInput } = Utils;

    it('should correctly parse standard formatted strings', () => {
      expect(parseCurrencyInput('1234,56')).toBe(1234.56);
      expect(parseCurrencyInput('1.234,56')).toBe(1234.56);
      expect(parseCurrencyInput('1.234.567,89')).toBe(1234567.89);
    });

    it('should correctly parse strings with currency symbols and spaces', () => {
      expect(parseCurrencyInput('R$ 1.234,56')).toBe(1234.56);
      expect(parseCurrencyInput('R$1234,56')).toBe(1234.56);
      expect(parseCurrencyInput('  1234,56  ')).toBe(1234.56);
      expect(parseCurrencyInput('R$ 1.234.567,89')).toBe(1234567.89);
    });

    it('should correctly parse integer strings without decimals', () => {
      expect(parseCurrencyInput('1234')).toBe(1234);
      expect(parseCurrencyInput('R$ 1234')).toBe(1234);
      expect(parseCurrencyInput('1.234')).toBe(1234);
    });

    it('should handle zero values correctly', () => {
      expect(parseCurrencyInput('0')).toBe(0);
      expect(parseCurrencyInput('0,00')).toBe(0);
      expect(parseCurrencyInput('R$ 0,00')).toBe(0);
    });

    it('should return 0 for non-numeric string formats', () => {
      expect(parseCurrencyInput('abc')).toBe(0);
      expect(parseCurrencyInput('R$ abc')).toBe(0);
      expect(parseCurrencyInput('')).toBe(0);
      expect(parseCurrencyInput('   ')).toBe(0);
    });

    it('should return the original value if not a string', () => {
      expect(parseCurrencyInput(1234.56)).toBe(1234.56);
      expect(parseCurrencyInput(null)).toBeNull();
      expect(parseCurrencyInput(undefined)).toBeUndefined();
      const obj = {};
      expect(parseCurrencyInput(obj)).toBe(obj);
    });
  });
});

describe('FinancialCalculator', () => {
  describe('annualToMonthlyRate', () => {
    const { annualToMonthlyRate } = FinancialCalculator;

    it('should correctly convert 0% annual rate to 0% monthly rate', () => {
      expect(annualToMonthlyRate(0)).toBeCloseTo(0, 10);
    });

    it('should correctly convert 100% annual rate to ~5.946% monthly rate', () => {
      // (1 + 100/100)^(1/12) - 1 = 2^(1/12) - 1 ≈ 0.059463
      expect(annualToMonthlyRate(100)).toBeCloseTo(0.059463, 6);
    });

    it('should correctly convert a typical Selic rate (e.g. 10.47%) to a monthly rate', () => {
      // (1 + 10.47/100)^(1/12) - 1 ≈ 0.0083323...
      expect(annualToMonthlyRate(10.47)).toBeCloseTo(0.0083323, 6);
    });

    it('should correctly convert a negative annual rate', () => {
      // (1 + -10/100)^(1/12) - 1 = 0.9^(1/12) - 1 ≈ -0.0087416...
      expect(annualToMonthlyRate(-10)).toBeCloseTo(-0.0087416, 6);
    });
  });
});
