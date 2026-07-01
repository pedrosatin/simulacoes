/**
 * @jest-environment jsdom
 */
const { FinancialCalculator } = require('./a-vista-vs-parcelado.js');

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
