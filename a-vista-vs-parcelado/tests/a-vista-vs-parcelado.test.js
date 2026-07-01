const { FinancialCalculator } = require('../a-vista-vs-parcelado.js');

describe('FinancialCalculator', () => {
  describe('calculateCompoundInterest', () => {
    it('should correctly calculate compound interest for basic values', () => {
      // principal: 1000, monthlyRate: 1% (0.01), months: 12
      // expected: 1000 * (1.01)^12 ≈ 1126.825
      const principal = 1000;
      const monthlyRate = 0.01;
      const months = 12;
      const expected = 1126.8250301319698;

      const result = FinancialCalculator.calculateCompoundInterest(principal, monthlyRate, months);
      expect(result).toBeCloseTo(expected, 5);
    });

    it('should return the principal if months is 0', () => {
      const principal = 500;
      const monthlyRate = 0.05;
      const months = 0;

      const result = FinancialCalculator.calculateCompoundInterest(principal, monthlyRate, months);
      expect(result).toBe(principal);
    });

    it('should return the principal if rate is 0', () => {
      const principal = 1500;
      const monthlyRate = 0;
      const months = 24;

      const result = FinancialCalculator.calculateCompoundInterest(principal, monthlyRate, months);
      expect(result).toBe(principal);
    });

    it('should return 0 if principal is 0', () => {
      const principal = 0;
      const monthlyRate = 0.1;
      const months = 5;

      const result = FinancialCalculator.calculateCompoundInterest(principal, monthlyRate, months);
      expect(result).toBe(0);
    });

    it('should handle fractional months properly', () => {
      // Though rare in typical usage, it's mathematically sound
      const principal = 1000;
      const monthlyRate = 0.02;
      const months = 6.5; // half a month

      const expected = 1000 * Math.pow(1.02, 6.5);
      const result = FinancialCalculator.calculateCompoundInterest(principal, monthlyRate, months);
      expect(result).toBeCloseTo(expected, 5);
    });
  });
});
