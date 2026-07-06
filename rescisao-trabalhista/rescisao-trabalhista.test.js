const { calculateSalaryBalance, calculateFGTSPenalty, calculateThirteenthSalary, CONSTANTS } = require('./rescisao-trabalhista.js')

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

describe('calculateThirteenthSalary', () => {
  it('should return 0 for demissao-justa-causa', () => {
    const dados = { tipoRescisao: 'demissao-justa-causa', salario: 3000, dataAdmissao: new Date(2022, 0, 1), dataRescisao: new Date(2023, 11, 31) }
    expect(calculateThirteenthSalary(dados)).toBe(0)
  })

  it('should count the month if hired and fired in the same year, and fired on the 15th or later', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2023, 0, 1), // Jan 1st
      dataRescisao: new Date(2023, 1, 15) // Feb 15th
    }
    // Expected: 2 months (Jan, Feb). 1200 / 12 * 2 = 200
    expect(calculateThirteenthSalary(dados)).toBe(200)
  })

  it('should NOT count the month if hired and fired in the same year, and fired on the 14th or earlier', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2023, 0, 1), // Jan 1st
      dataRescisao: new Date(2023, 1, 14) // Feb 14th
    }
    // Expected: 1 month (Jan). Feb has < 15 days. 1200 / 12 * 1 = 100
    expect(calculateThirteenthSalary(dados)).toBe(100)
  })

  it('should count the month if hired in a previous year, and fired on the 15th or later', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2022, 5, 10), // Jun 10, previous year
      dataRescisao: new Date(2023, 2, 15) // Mar 15th
    }
    // Expected: 3 months (Jan, Feb, Mar). 1200 / 12 * 3 = 300
    expect(calculateThirteenthSalary(dados)).toBe(300)
  })

  it('should NOT count the month if hired in a previous year, and fired on the 14th or earlier', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2022, 5, 10), // Jun 10, previous year
      dataRescisao: new Date(2023, 2, 14) // Mar 14th
    }
    // Expected: 2 months (Jan, Feb). 1200 / 12 * 2 = 200
    expect(calculateThirteenthSalary(dados)).toBe(200)
  })

  it('should return 0 if hired and fired in the same month with less than 15 days worked', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2023, 5, 1), // Jun 1st
      dataRescisao: new Date(2023, 5, 14) // Jun 14th
    }
    // Expected: 0 months. 1200 / 12 * 0 = 0
    expect(calculateThirteenthSalary(dados)).toBe(0)
  })

  it('should return correct proportional value if hired late in the year', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 2400,
      dataAdmissao: new Date(2023, 10, 1), // Nov 1st
      dataRescisao: new Date(2023, 11, 31) // Dec 31st
    }
    // Expected: 2 months (Nov, Dec). 2400 / 12 * 2 = 400
    expect(calculateThirteenthSalary(dados)).toBe(400)
  })
})
