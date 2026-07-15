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

  describe('calculateCashCost', () => {
    it('should correctly calculate cash cost for typical values', () => {
      const cashValue = 1000;
      const productValue = 1200;
      const selicRate = 10.47;
      const installments = 12;

      const result = FinancialCalculator.calculateCashCost(cashValue, productValue, selicRate, installments);

      const expectedMonthlyRate = FinancialCalculator.annualToMonthlyRate(selicRate);

      expect(result.cashPayment).toBe(1000);
      expect(result.effectiveCost).toBe(1000);
      expect(result.monthlyRate).toBe(expectedMonthlyRate);
    });

    it('should calculate correctly when Selic rate is 0%', () => {
      const cashValue = 500;
      const productValue = 500;
      const selicRate = 0;
      const installments = 10;

      const result = FinancialCalculator.calculateCashCost(cashValue, productValue, selicRate, installments);

      const expectedMonthlyRate = FinancialCalculator.annualToMonthlyRate(0);

      expect(result.cashPayment).toBe(500);
      expect(result.effectiveCost).toBe(500);
      expect(result.monthlyRate).toBe(expectedMonthlyRate);
    });
  });

  describe('calculateInstallmentCost', () => {
    it('should calculate installment cost correctly for typical values', () => {
      const productValue = 1200;
      const cashValue = 1000;
      const selicRate = 10.47;
      const installments = 12;

      const result = FinancialCalculator.calculateInstallmentCost(productValue, cashValue, selicRate, installments);

      expect(result.installmentValue).toBe(100);
      expect(result.totalCost).toBe(1200);

      // Calculate expected manually:
      const monthlyRate = FinancialCalculator.annualToMonthlyRate(selicRate);

      let expectedPresentValue = 0;
      let currentDiscountFactor = 1 + monthlyRate;
      for (let month = 1; month <= installments; month++) {
        expectedPresentValue += 100 / currentDiscountFactor;
        currentDiscountFactor *= (1 + monthlyRate);
      }

      const averagePeriod = 6; // 12 / 2
      const selicReturn = cashValue * Math.pow(1 + monthlyRate, averagePeriod);
      const opportunityCost = selicReturn - cashValue;

      expect(result.effectiveCost).toBeCloseTo(expectedPresentValue, 5);
      expect(result.selicReturn).toBeCloseTo(selicReturn, 5);
      expect(result.opportunityCost).toBeCloseTo(opportunityCost, 5);
      expect(result.presentValueOfInstallments).toBeCloseTo(expectedPresentValue, 5);
    });

    it('should calculate correctly when Selic rate is 0%', () => {
      const productValue = 1200;
      const cashValue = 1000;
      const selicRate = 0;
      const installments = 12;

      const result = FinancialCalculator.calculateInstallmentCost(productValue, cashValue, selicRate, installments);

      expect(result.installmentValue).toBe(100);
      expect(result.totalCost).toBe(1200);
      expect(result.effectiveCost).toBe(1200);
      expect(result.selicReturn).toBe(1000);
      expect(result.opportunityCost).toBe(0);
      expect(result.presentValueOfInstallments).toBe(1200);
    });

    it('should calculate correctly for a single installment', () => {
      const productValue = 500;
      const cashValue = 450;
      const selicRate = 10.47;
      const installments = 1;

      const result = FinancialCalculator.calculateInstallmentCost(productValue, cashValue, selicRate, installments);

      expect(result.installmentValue).toBe(500);
      expect(result.totalCost).toBe(500);

      const monthlyRate = FinancialCalculator.annualToMonthlyRate(selicRate);

      // 1 installment means it's paid in month 1
      const expectedPresentValue = 500 / (1 + monthlyRate);

      const averagePeriod = 0.5; // 1 / 2
      const selicReturn = cashValue * Math.pow(1 + monthlyRate, averagePeriod);
      const opportunityCost = selicReturn - cashValue;

      expect(result.effectiveCost).toBeCloseTo(expectedPresentValue, 5);
      expect(result.selicReturn).toBeCloseTo(selicReturn, 5);
      expect(result.opportunityCost).toBeCloseTo(opportunityCost, 5);
      expect(result.presentValueOfInstallments).toBeCloseTo(expectedPresentValue, 5);
    });
  });
});
