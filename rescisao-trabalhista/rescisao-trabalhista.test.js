const { calculateSalaryBalance, CONSTANTS } = require('./rescisao-trabalhista.js')

describe('calculateSalaryBalance', () => {
  it('should correctly calculate the salary balance for a mid-month rescision', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 9, 15) // Oct 15
    }
    // Expected: (3000 / 30) * 15 = 1500
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(1500)
  })

  it('should correctly calculate the salary balance for a rescision on the 1st day of the month', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 9, 1) // Oct 1
    }
    // Expected: (3000 / 30) * 1 = 100
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(100)
  })

  it('should correctly calculate the salary balance for a rescision on the last day of a 31-day month', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 9, 31) // Oct 31
    }
    // Expected: (3000 / 30) * 31 = 3100
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(3100)
  })

  it('should correctly calculate the salary balance for a rescision on the last day of a 28-day month (February)', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 1, 28) // Feb 28
    }
    // Expected: (3000 / 30) * 28 = 2800
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(2800)
  })

  it('should correctly calculate the salary balance with a decimal salary', () => {
    const dados = {
      salario: 1518.50,
      dataRescisao: new Date(2023, 9, 15) // Oct 15
    }
    // Expected: (1518.50 / 30) * 15 = 759.25
    const result = calculateSalaryBalance(dados)
    expect(result).toBeCloseTo(759.25)
  })

  it('should correctly rely on CONSTANTS.DIAS_MES instead of the actual number of days in the month', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 1, 15) // Feb 15
    }
    // Despite being February (28 days), the formula uses CONSTANTS.DIAS_MES (30 days)
    // Expected: (3000 / 30) * 15 = 1500
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(1500)
  })

  it('should return 0 when salary is 0', () => {
    const dados = {
      salario: 0,
      dataRescisao: new Date(2023, 9, 15) // Oct 15
    }
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(0)
  })
})
