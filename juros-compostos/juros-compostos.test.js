/**
 * @jest-environment node
 */
const { JurosMath, Format, JurosCompostosCalculadora } = require('./juros-compostos.js')

describe('JurosMath', () => {
  describe('annualToMonthly', () => {
    it('converte 0% ao ano em 0% ao mês', () => {
      expect(JurosMath.annualToMonthly(0)).toBeCloseTo(0, 10)
    })

    it('converte 100% ao ano em ~5,946% ao mês', () => {
      // 2^(1/12) - 1 ≈ 0.059463
      expect(JurosMath.annualToMonthly(100)).toBeCloseTo(0.059463, 6)
    })

    it('converte 12,68% ao ano em ~1% ao mês', () => {
      expect(JurosMath.annualToMonthly(12.6825)).toBeCloseTo(0.01, 5)
    })
  })

  describe('monthlyToAnnual', () => {
    it('é a inversa de annualToMonthly', () => {
      const monthly = JurosMath.annualToMonthly(15) // decimal
      expect(JurosMath.monthlyToAnnual(monthly * 100)).toBeCloseTo(15, 6)
    })
  })

  describe('compoundInterest', () => {
    it('calcula montante de valor único', () => {
      // 1000 * 1.01^12 ≈ 1126.825
      expect(JurosMath.compoundInterest(1000, 0.01, 12)).toBeCloseTo(
        1126.8250301,
        5,
      )
    })

    it('retorna o principal quando meses é 0', () => {
      expect(JurosMath.compoundInterest(500, 0.05, 0)).toBe(500)
    })

    it('retorna o principal quando taxa é 0', () => {
      expect(JurosMath.compoundInterest(1500, 0, 24)).toBe(1500)
    })
  })

  describe('futureValueOfContributions', () => {
    it('soma simples quando taxa é 0', () => {
      expect(JurosMath.futureValueOfContributions(100, 0, 10)).toBe(1000)
    })

    it('calcula série postecipada com juros', () => {
      // 100 * ((1.01^12 - 1) / 0.01) ≈ 1268.250
      expect(JurosMath.futureValueOfContributions(100, 0.01, 12)).toBeCloseTo(
        1268.250301,
        4,
      )
    })

    it('retorna 0 quando meses é 0', () => {
      expect(JurosMath.futureValueOfContributions(100, 0.01, 0)).toBe(0)
    })
  })

  describe('futureValue', () => {
    it('soma valor inicial e aportes', () => {
      const only = JurosMath.compoundInterest(1000, 0.01, 12)
      const contrib = JurosMath.futureValueOfContributions(100, 0.01, 12)
      expect(JurosMath.futureValue(1000, 100, 0.01, 12)).toBeCloseTo(
        only + contrib,
        6,
      )
    })
  })

  describe('requiredCapitalForIncome', () => {
    it('renda / taxa (perpetuidade)', () => {
      // 5000 / 0.005 = 1.000.000
      expect(JurosMath.requiredCapitalForIncome(5000, 0.005)).toBe(1000000)
    })

    it('retorna Infinity quando taxa é 0', () => {
      expect(JurosMath.requiredCapitalForIncome(5000, 0)).toBe(Infinity)
    })
  })

  describe('monthsToReachTarget', () => {
    it('retorna 0 quando já atingiu a meta', () => {
      expect(JurosMath.monthsToReachTarget(1000, 100, 0.01, 500)).toBe(0)
    })

    it('divisão simples quando taxa é 0', () => {
      // faltam 1000, aporte 100 => 10 meses
      expect(JurosMath.monthsToReachTarget(0, 100, 0, 1000)).toBe(10)
    })

    it('Infinity quando taxa 0 e sem aportes', () => {
      expect(JurosMath.monthsToReachTarget(0, 0, 0, 1000)).toBe(Infinity)
    })

    it('n é consistente com futureValue', () => {
      const n = JurosMath.monthsToReachTarget(1000, 200, 0.01, 50000)
      const fv = JurosMath.futureValue(1000, 200, 0.01, n)
      expect(fv).toBeCloseTo(50000, 4)
    })
  })

  describe('buildYearlyEvolution', () => {
    it('gera uma linha por ano', () => {
      const rows = JurosMath.buildYearlyEvolution(1000, 100, 0.01, 36)
      expect(rows).toHaveLength(3)
      expect(rows[0].year).toBe(1)
      expect(rows[2].year).toBe(3)
    })

    it('trunca no último mês quando não é múltiplo de 12', () => {
      const rows = JurosMath.buildYearlyEvolution(1000, 100, 0.01, 18)
      expect(rows).toHaveLength(2)
      expect(rows[1].months).toBe(18)
    })

    it('saldo = investido + juros em cada linha', () => {
      const rows = JurosMath.buildYearlyEvolution(1000, 100, 0.01, 24)
      rows.forEach((r) => {
        expect(r.balance).toBeCloseTo(r.invested + r.interest, 6)
      })
    })
  })
})

describe('JurosCompostosCalculadora', () => {
  describe('aporteExtraParaMeta', () => {
    let calc

    beforeEach(() => {
      // Instantiate without triggering DOM-dependent constructor
      calc = Object.create(JurosCompostosCalculadora.prototype)
    })

    it('retorna 0 se a meta já foi atingida pelo principal', () => {
      // 1000 a 1% ao mês por 10 meses > 1000
      expect(calc.aporteExtraParaMeta(1000, 0.01, 10, 1000)).toBe(0)
    })

    it('calcula o aporte necessário corretamente', () => {
      // 1000 a 1% ao mês por 12 meses. Meta: 2000
      // Fator de contribuição = (1.01^12 - 1) / 0.01 ≈ 12.68
      // Juros sobre principal = 1000 * 1.01^12 ≈ 1126.83
      // Restante = 2000 - 1126.83 = 873.17
      // Aporte = 873.17 / 12.68 ≈ 68.85
      expect(calc.aporteExtraParaMeta(1000, 0.01, 12, 2000)).toBeCloseTo(
        68.84878867834169,
        5,
      )
    })

    it('retorna Infinity se o prazo for 0 e a meta não foi atingida', () => {
      expect(calc.aporteExtraParaMeta(1000, 0.01, 0, 2000)).toBe(Infinity)
    })
  })
})

describe('Format', () => {
  describe('parseNumber', () => {
    it('converte formato brasileiro', () => {
      expect(Format.parseNumber('1.234,56')).toBeCloseTo(1234.56, 2)
    })

    it('converte número sem separador de milhar', () => {
      expect(Format.parseNumber('1234,56')).toBeCloseTo(1234.56, 2)
    })

    it('retorna 0 para string vazia', () => {
      expect(Format.parseNumber('')).toBe(0)
    })
  })

  describe('monthsToText', () => {
    it('formata anos e meses', () => {
      expect(Format.monthsToText(14)).toBe('1 ano e 2 meses')
    })

    it('só anos quando múltiplo de 12', () => {
      expect(Format.monthsToText(24)).toBe('2 anos')
    })

    it('arredonda meses fracionários para cima', () => {
      expect(Format.monthsToText(13.2)).toBe('1 ano e 2 meses')
    })

    it('trata Infinity', () => {
      expect(Format.monthsToText(Infinity)).toBe('nunca (juros insuficientes)')
    })
  })
})
