const { calculateSalaryBalance, calculatePriorNotice, calculateFGTSPenalty, CONSTANTS } = require('./rescisao-trabalhista.js')

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

describe('calculateFGTSPenalty', () => {
  it('should return 0 for demissao-justa-causa', () => {
    const dados = { tipoRescisao: 'demissao-justa-causa', saldoFGTS: 1000 }
    expect(calculateFGTSPenalty(dados)).toBe(0)
  })

  it('should return 0 for pedido-demissao', () => {
    const dados = { tipoRescisao: 'pedido-demissao', saldoFGTS: 1000 }
    expect(calculateFGTSPenalty(dados)).toBe(0)
  })

  it('should return 0 when saldoFGTS is 0', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', saldoFGTS: 0 }
    expect(calculateFGTSPenalty(dados)).toBe(0)
  })

  it('should calculate 40% penalty for demissao-sem-justa-causa', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', saldoFGTS: 1000, saqueAniversario: false }
    expect(calculateFGTSPenalty(dados)).toBe(400) // 1000 * 0.4
  })

  it('should calculate 20% penalty for acordo', () => {
    const dados = { tipoRescisao: 'acordo', saldoFGTS: 1000, saqueAniversario: false }
    expect(calculateFGTSPenalty(dados)).toBe(200) // 1000 * 0.2
  })

  it('should calculate 20% penalty for demissao-sem-justa-causa when saqueAniversario is true', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', saldoFGTS: 1000, saqueAniversario: true }
    expect(calculateFGTSPenalty(dados)).toBe(200) // 1000 * 0.2
  })
})

describe('calculatePriorNotice', () => {
  it('should return 0 for demissao-justa-causa', () => {
    const dados = { tipoRescisao: 'demissao-justa-causa', salario: 3000 }
    const periodo = { anos: 2 }
    expect(calculatePriorNotice(dados, periodo)).toBe(0)
  })

  it('should return 0 for pedido-demissao when 0 notice is given', () => {
    const dados = { tipoRescisao: 'pedido-demissao', salario: 3000, diasAviso: 0 }
    const periodo = { anos: 2 }
    expect(calculatePriorNotice(dados, periodo)).toBe(0)
  })

  it('should calculate correctly for pedido-demissao when notice is given partially', () => {
    const dados = { tipoRescisao: 'pedido-demissao', salario: 3000, diasAviso: 10 }
    const periodo = { anos: 2 } // 30 + 6 = 36 days. 36 - 10 = 26 days to be paid
    // expected: (3000 / 30) * 26 = 2600
    expect(calculatePriorNotice(dados, periodo)).toBe(2600)
  })

  it('should calculate base 30 days for demissao-sem-justa-causa with 0 years worked', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', salario: 3000, diasAviso: 0 }
    const periodo = { anos: 0 }
    // expected: (3000 / 30) * 30 = 3000
    expect(calculatePriorNotice(dados, periodo)).toBe(3000)
  })

  it('should add 3 days per year worked for demissao-sem-justa-causa', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', salario: 3000, diasAviso: 0 }
    const periodo = { anos: 5 } // 30 + 15 = 45 days
    // expected: (3000 / 30) * 45 = 4500
    expect(calculatePriorNotice(dados, periodo)).toBe(4500)
  })

  it('should cap the prior notice at 90 days', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', salario: 3000, diasAviso: 0 }
    const periodo = { anos: 25 } // 30 + 75 = 105 days, capped at 90
    // expected: (3000 / 30) * 90 = 9000
    expect(calculatePriorNotice(dados, periodo)).toBe(9000)
  })

  it('should subtract worked days from the total notice days', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', salario: 3000, diasAviso: 15 }
    const periodo = { anos: 3 } // 30 + 9 = 39 days. 39 - 15 = 24 days
    // expected: (3000 / 30) * 24 = 2400
    expect(calculatePriorNotice(dados, periodo)).toBe(2400)
  })

  it('should apply 50% reduction for acordo', () => {
    const dados = { tipoRescisao: 'acordo', salario: 3000, diasAviso: 0 }
    const periodo = { anos: 4 } // 30 + 12 = 42 days. 42 * 0.5 = 21 days
    // expected: (3000 / 30) * 21 = 2100
    expect(calculatePriorNotice(dados, periodo)).toBe(2100)
  })

  it('should apply 50% reduction for acordo with partial worked notice', () => {
    const dados = { tipoRescisao: 'acordo', salario: 3000, diasAviso: 10 }
    const periodo = { anos: 4 } // 30 + 12 = 42 days. 42 - 10 = 32. 32 * 0.5 = 16 days
    // expected: (3000 / 30) * 16 = 1600
    expect(calculatePriorNotice(dados, periodo)).toBe(1600)
  })
})
