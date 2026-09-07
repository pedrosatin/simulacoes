const {
  calculateWorkPeriod,
  calculateCompleteYears,
  calculateCompleteMonths,
  calculateRemainingDays,
  calculateSalaryBalance,
  calculatePriorNotice,
  calculateFGTSPenalty,
  calculateProportionalVacation,
  calculateVacationDue,
  calculateThirteenthSalary,
  CONSTANTS,
} = require('./rescisao-trabalhista.js')

describe('calculateSalaryBalance', () => {
  it('should correctly calculate the salary balance for a mid-month rescision', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 9, 15), // Oct 15
    }
    // Expected: (3000 / 30) * 15 = 1500
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(1500)
  })

  it('should correctly calculate the salary balance for a rescision on the 1st day of the month', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 9, 1), // Oct 1
    }
    // Expected: (3000 / 30) * 1 = 100
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(100)
  })

  it('should correctly calculate the salary balance for a rescision on the last day of a 31-day month', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 9, 31), // Oct 31
    }
    // Expected: (3000 / 30) * 31 = 3100
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(3100)
  })

  it('should correctly calculate the salary balance for a rescision on the last day of a 28-day month (February)', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 1, 28), // Feb 28
    }
    // Expected: (3000 / 30) * 28 = 2800
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(2800)
  })

  it('should correctly calculate the salary balance with a decimal salary', () => {
    const dados = {
      salario: 1518.5,
      dataRescisao: new Date(2023, 9, 15), // Oct 15
    }
    // Expected: (1518.50 / 30) * 15 = 759.25
    const result = calculateSalaryBalance(dados)
    expect(result).toBeCloseTo(759.25)
  })

  it('should correctly rely on CONSTANTS.DIAS_MES instead of the actual number of days in the month', () => {
    const dados = {
      salario: 3000,
      dataRescisao: new Date(2023, 1, 15), // Feb 15
    }
    // Despite being February (28 days), the formula uses CONSTANTS.DIAS_MES (30 days)
    // Expected: (3000 / 30) * 15 = 1500
    const result = calculateSalaryBalance(dados)
    expect(result).toBe(1500)
  })

  it('should return 0 when salary is 0', () => {
    const dados = {
      salario: 0,
      dataRescisao: new Date(2023, 9, 15), // Oct 15
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
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      saldoFGTS: 1000,
      saqueAniversario: false,
    }
    expect(calculateFGTSPenalty(dados)).toBe(400) // 1000 * 0.4
  })

  it('should calculate 20% penalty for acordo', () => {
    const dados = {
      tipoRescisao: 'acordo',
      saldoFGTS: 1000,
      saqueAniversario: false,
    }
    expect(calculateFGTSPenalty(dados)).toBe(200) // 1000 * 0.2
  })

  it('should calculate 20% penalty for demissao-sem-justa-causa when saqueAniversario is true', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      saldoFGTS: 1000,
      saqueAniversario: true,
    }
    expect(calculateFGTSPenalty(dados)).toBe(200) // 1000 * 0.2
  })
})

describe('calculateThirteenthSalary', () => {
  it('should return 0 for demissao-justa-causa', () => {
    const dados = {
      tipoRescisao: 'demissao-justa-causa',
      salario: 3000,
      dataAdmissao: new Date(2022, 0, 1),
      dataRescisao: new Date(2023, 11, 31),
    }
    expect(calculateThirteenthSalary(dados)).toBe(0)
  })

  it('should count the month if hired and fired in the same year, and fired on the 15th or later', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2023, 0, 1), // Jan 1st
      dataRescisao: new Date(2023, 1, 15), // Feb 15th
    }
    // Expected: 2 months (Jan, Feb). 1200 / 12 * 2 = 200
    expect(calculateThirteenthSalary(dados)).toBe(200)
  })

  it('should NOT count the month if hired and fired in the same year, and fired on the 14th or earlier', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2023, 0, 1), // Jan 1st
      dataRescisao: new Date(2023, 1, 14), // Feb 14th
    }
    // Expected: 1 month (Jan). Feb has < 15 days. 1200 / 12 * 1 = 100
    expect(calculateThirteenthSalary(dados)).toBe(100)
  })

  it('should count the month if hired in a previous year, and fired on the 15th or later', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2022, 5, 10), // Jun 10, previous year
      dataRescisao: new Date(2023, 2, 15), // Mar 15th
    }
    // Expected: 3 months (Jan, Feb, Mar). 1200 / 12 * 3 = 300
    expect(calculateThirteenthSalary(dados)).toBe(300)
  })

  it('should NOT count the month if hired in a previous year, and fired on the 14th or earlier', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2022, 5, 10), // Jun 10, previous year
      dataRescisao: new Date(2023, 2, 14), // Mar 14th
    }
    // Expected: 2 months (Jan, Feb). 1200 / 12 * 2 = 200
    expect(calculateThirteenthSalary(dados)).toBe(200)
  })

  it('should return 0 if hired and fired in the same month with less than 15 days worked', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 1200,
      dataAdmissao: new Date(2023, 5, 1), // Jun 1st
      dataRescisao: new Date(2023, 5, 14), // Jun 14th
    }
    // Expected: 0 months. 1200 / 12 * 0 = 0
    expect(calculateThirteenthSalary(dados)).toBe(0)
  })

  it('should return correct proportional value if hired late in the year', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 2400,
      dataAdmissao: new Date(2023, 10, 1), // Nov 1st
      dataRescisao: new Date(2023, 11, 31), // Dec 31st
    }
    // Expected: 2 months (Nov, Dec). 2400 / 12 * 2 = 400
    expect(calculateThirteenthSalary(dados)).toBe(400)
  })
})

describe('calculatePriorNotice', () => {
  it('should return 0 for demissao-justa-causa', () => {
    const dados = { tipoRescisao: 'demissao-justa-causa', salario: 3000 }
    const periodo = { anos: 2 }
    expect(calculatePriorNotice(dados, periodo)).toBe(0)
  })

  it('should return 0 for pedido-demissao when 0 notice is given', () => {
    const dados = {
      tipoRescisao: 'pedido-demissao',
      salario: 3000,
      diasAviso: 0,
    }
    const periodo = { anos: 2 }
    expect(calculatePriorNotice(dados, periodo)).toBe(0)
  })

  it('should calculate correctly for pedido-demissao when notice is given partially', () => {
    const dados = {
      tipoRescisao: 'pedido-demissao',
      salario: 3000,
      diasAviso: 10,
    }
    const periodo = { anos: 2 } // 30 + 6 = 36 days. 36 - 10 = 26 days to be paid
    // expected: (3000 / 30) * 26 = 2600
    expect(calculatePriorNotice(dados, periodo)).toBe(2600)
  })

  it('should calculate base 30 days for demissao-sem-justa-causa with 0 years worked', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 3000,
      diasAviso: 0,
    }
    const periodo = { anos: 0 }
    // expected: (3000 / 30) * 30 = 3000
    expect(calculatePriorNotice(dados, periodo)).toBe(3000)
  })

  it('should add 3 days per year worked for demissao-sem-justa-causa', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 3000,
      diasAviso: 0,
    }
    const periodo = { anos: 5 } // 30 + 15 = 45 days
    // expected: (3000 / 30) * 45 = 4500
    expect(calculatePriorNotice(dados, periodo)).toBe(4500)
  })

  it('should cap the prior notice at 90 days', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 3000,
      diasAviso: 0,
    }
    const periodo = { anos: 25 } // 30 + 75 = 105 days, capped at 90
    // expected: (3000 / 30) * 90 = 9000
    expect(calculatePriorNotice(dados, periodo)).toBe(9000)
  })

  it('should subtract worked days from the total notice days', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 3000,
      diasAviso: 15,
    }
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

describe('calculateProportionalVacation', () => {
  it('should return 0 for demissao-justa-causa', () => {
    const dados = {
      tipoRescisao: 'demissao-justa-causa',
      salario: 3000,
      dataAdmissao: new Date(2022, 0, 1),
      dataRescisao: new Date(2023, 6, 1),
    }
    const periodo = { anos: 1 }
    expect(calculateProportionalVacation(dados, periodo)).toBe(0)
  })

  it('should calculate 0 months if less than 15 days worked since the last anniversary', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 3000,
      dataAdmissao: new Date(2022, 0, 1), // Jan 1, 2022
      dataRescisao: new Date(2023, 0, 14), // Jan 14, 2023 (13 days diff since Jan 1)
    }
    const periodo = { anos: 1 }
    // Expected: 0 months. (3000 / 12) * 0 = 0. + 1/3 = 0. Total = 0.
    expect(calculateProportionalVacation(dados, periodo)).toBe(0)
  })

  it('should calculate 1 month if exactly 15 days worked since the last anniversary', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 3000,
      dataAdmissao: new Date(2022, 0, 1), // Jan 1, 2022
      dataRescisao: new Date(2023, 0, 16), // Jan 16, 2023 (15 days diff since Jan 1)
    }
    const periodo = { anos: 1 }
    // Expected: 1 month. (3000 / 12) * 1 = 250. + 1/3 = 83.33. Total = 333.33...
    const result = calculateProportionalVacation(dados, periodo)
    const expected = (3000 / 12) * 1 * (1 + CONSTANTS.ADICIONAL_FERIAS)
    expect(result).toBeCloseTo(expected)
  })

  it('should calculate correctly across multiple months (e.g. 2 months and 14 days)', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 3000,
      dataAdmissao: new Date(2022, 0, 1), // Jan 1, 2022
      dataRescisao: new Date(2023, 2, 14), // Mar 14, 2023 (2 months, 13 days diff since Jan 1)
    }
    const periodo = { anos: 1 }
    // Note: Feb has 28 days usually. But let's see how the diff math is calculated:
    // math: diffTime / (1000 * 60 * 60 * 24 * 30).
    // Let's rely on the function's actual execution for testing diff math.
    // Mar 14 - Jan 1 = 72 days diff
    // 72 / 30 = 2 months (60 days) + 12 days left
    // 12 days < 15 days, so 2 months adjusted.
    const expected = (3000 / 12) * 2 * (1 + CONSTANTS.ADICIONAL_FERIAS)
    expect(calculateProportionalVacation(dados, periodo)).toBeCloseTo(expected)
  })

  it('should calculate correctly across multiple months (e.g. 2 months and 15 days)', () => {
    const dados = {
      tipoRescisao: 'demissao-sem-justa-causa',
      salario: 3000,
      dataAdmissao: new Date(2022, 0, 1), // Jan 1, 2022
      dataRescisao: new Date(2023, 2, 17), // Mar 17, 2023 (2 months, 16 days diff since Jan 1)
    }
    const periodo = { anos: 1 }
    // Mar 17 - Jan 1 = 75 days diff
    // 75 / 30 = 2 months (60 days) + 15 days left
    // 15 days >= 15 days, so 3 months adjusted.
    const expected = (3000 / 12) * 3 * (1 + CONSTANTS.ADICIONAL_FERIAS)
    expect(calculateProportionalVacation(dados, periodo)).toBeCloseTo(expected)
  })
})

describe('calculateVacationDue', () => {
  it('should return 0 when there are no vacations due', () => {
    const dados = {
      salario: 3000,
      feriasVencidas: 0,
    }
    expect(calculateVacationDue(dados)).toBe(0)
  })

  it('should correctly calculate for 1 period of vacation due', () => {
    const dados = {
      salario: 3000,
      feriasVencidas: 1,
    }
    // 3000 + 1/3 of 3000 (1000) = 4000
    expect(calculateVacationDue(dados)).toBe(4000)
  })

  it('should correctly calculate for multiple periods of vacation due', () => {
    const dados = {
      salario: 3000,
      feriasVencidas: 2,
    }
    // 6000 + 1/3 of 6000 (2000) = 8000
    expect(calculateVacationDue(dados)).toBe(8000)
  })

  it('should correctly calculate for fractional periods of vacation due', () => {
    const dados = {
      salario: 3000,
      feriasVencidas: 1.5,
    }
    // 4500 + 1/3 of 4500 (1500) = 6000
    expect(calculateVacationDue(dados)).toBe(6000)
  })
})

// Datas locais a meia-noite, para nao depender do fuso do ambiente
const d = (iso) => new Date(`${iso}T00:00:00`)

describe('calculateCompleteYears', () => {
  it('should count whole years and advance the cursor', () => {
    const cursor = d('2020-01-15')
    expect(calculateCompleteYears(cursor, d('2023-01-15'))).toBe(3)
    expect(cursor).toEqual(d('2023-01-15'))
  })

  it('should not count a year that has not closed yet', () => {
    const cursor = d('2020-01-15')
    expect(calculateCompleteYears(cursor, d('2023-01-14'))).toBe(2)
    expect(cursor).toEqual(d('2022-01-15'))
  })

  it('should count the year on the exact anniversary', () => {
    expect(calculateCompleteYears(d('2022-03-10'), d('2023-03-10'))).toBe(1)
    expect(calculateCompleteYears(d('2022-03-10'), d('2023-03-09'))).toBe(0)
  })

  it('should return 0 when the dates are the same', () => {
    expect(calculateCompleteYears(d('2023-05-01'), d('2023-05-01'))).toBe(0)
  })
})

describe('calculateCompleteMonths', () => {
  it('should count whole months within the same year', () => {
    const cursor = d('2023-01-10')
    expect(calculateCompleteMonths(cursor, d('2023-04-10'))).toBe(3)
    expect(cursor).toEqual(d('2023-04-10'))
  })

  it('should count months across a year boundary', () => {
    // Regressao: a versao anterior comparava so getMonth(), entao dezembro ->
    // fevereiro devolvia 0 meses e distorcia 13o e ferias proporcionais.
    expect(calculateCompleteMonths(d('2022-12-20'), d('2023-02-19'))).toBe(1)
    expect(calculateCompleteMonths(d('2022-12-20'), d('2023-02-20'))).toBe(2)
    expect(calculateCompleteMonths(d('2022-11-05'), d('2023-10-05'))).toBe(11)
  })

  it('should not count a month that has not closed yet', () => {
    expect(calculateCompleteMonths(d('2023-01-10'), d('2023-04-09'))).toBe(2)
  })

  it('should return 0 when the dates are the same', () => {
    expect(calculateCompleteMonths(d('2023-05-01'), d('2023-05-01'))).toBe(0)
  })
})

describe('calculateRemainingDays', () => {
  it('should count the full days between the cursor and the end date', () => {
    expect(calculateRemainingDays(d('2023-05-01'), d('2023-05-16'))).toBe(15)
    expect(calculateRemainingDays(d('2023-05-01'), d('2023-05-01'))).toBe(0)
  })
})

describe('calculateWorkPeriod', () => {
  it('should break the period into years, months and days', () => {
    expect(calculateWorkPeriod(d('2022-06-10'), d('2023-08-25'))).toEqual({
      anos: 1,
      meses: 2,
      dias: 15,
      totalDias: 441,
      totalMeses: 15,
    })
  })

  it('should handle termination exactly on the admission anniversary', () => {
    expect(calculateWorkPeriod(d('2020-01-15'), d('2023-01-15'))).toEqual({
      anos: 3,
      meses: 0,
      dias: 0,
      totalDias: 1096,
      totalMeses: 36,
    })
  })

  it('should handle termination one day after the anniversary', () => {
    const periodo = calculateWorkPeriod(d('2020-01-15'), d('2023-01-16'))
    expect(periodo.anos).toBe(3)
    expect(periodo.meses).toBe(0)
    expect(periodo.dias).toBe(1)
  })

  it('should handle termination one day before the anniversary', () => {
    // Regressao: antes devolvia 2 anos, 0 meses e 364 dias, e um totalMeses
    // de 25 em vez de 36 — erro direto no 13o e nas ferias proporcionais.
    expect(calculateWorkPeriod(d('2020-01-15'), d('2023-01-14'))).toEqual({
      anos: 2,
      meses: 11,
      dias: 30,
      totalDias: 1095,
      totalMeses: 36,
    })
  })

  it('should count an extra month from 15 remaining days (regra dos 15 dias)', () => {
    expect(
      calculateWorkPeriod(d('2023-01-01'), d('2023-01-15')).totalMeses,
    ).toBe(0)
    expect(
      calculateWorkPeriod(d('2023-01-01'), d('2023-01-16')).totalMeses,
    ).toBe(1)
  })

  it('should handle a leap-day admission', () => {
    expect(calculateWorkPeriod(d('2020-02-29'), d('2021-02-28'))).toEqual({
      anos: 0,
      meses: 11,
      dias: 30,
      totalDias: 365,
      totalMeses: 12,
    })
  })

  it('should handle month-end admission rolling over a short month', () => {
    const periodo = calculateWorkPeriod(d('2023-01-31'), d('2023-02-28'))
    expect(periodo.anos).toBe(0)
    expect(periodo.meses).toBe(0)
    expect(periodo.dias).toBe(28)
  })

  it('should return a zeroed period when both dates are the same', () => {
    expect(calculateWorkPeriod(d('2023-01-01'), d('2023-01-01'))).toEqual({
      anos: 0,
      meses: 0,
      dias: 0,
      totalDias: 0,
      totalMeses: 0,
    })
  })
})
