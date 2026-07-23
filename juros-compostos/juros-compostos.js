/**
 * Calculadora de Juros Compostos e Investimentos
 * Autor: satinP
 * Data: 2025
 *
 * Reúne quatro ferramentas:
 *   1. Juros compostos (aporte inicial + aportes mensais)
 *   2. Viver de renda (patrimônio necessário para uma renda mensal)
 *   3. Comparador de investimentos (dois cenários lado a lado)
 *   4. Aposentadoria (projeção até a idade de aposentar)
 */

/* =====================================================================
   MOTOR MATEMÁTICO (funções puras, testáveis)
   ===================================================================== */
const JurosMath = {
  /**
   * Converte taxa anual (%) para taxa mensal equivalente (decimal).
   * (1 + a/100)^(1/12) - 1
   */
  annualToMonthly(annualPercent) {
    return Math.pow(1 + annualPercent / 100, 1 / 12) - 1
  },

  /**
   * Converte taxa mensal (%) para taxa anual equivalente (%).
   * ((1 + m/100)^12 - 1) * 100
   */
  monthlyToAnnual(monthlyPercent) {
    return (Math.pow(1 + monthlyPercent / 100, 12) - 1) * 100
  },

  /**
   * Montante de um valor único aplicado a juros compostos.
   * M = P * (1 + i)^n
   */
  compoundInterest(principal, monthlyRate, months) {
    return principal * Math.pow(1 + monthlyRate, months)
  },

  /**
   * Valor futuro de aportes mensais constantes (série postecipada).
   * FV = PMT * ((1 + i)^n - 1) / i
   */
  futureValueOfContributions(monthlyContribution, monthlyRate, months) {
    if (months <= 0) return 0
    if (monthlyRate === 0) return monthlyContribution * months
    return (
      monthlyContribution *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    )
  },

  /**
   * Valor futuro total: aporte inicial + aportes mensais.
   */
  futureValue(principal, monthlyContribution, monthlyRate, months) {
    return (
      this.compoundInterest(principal, monthlyRate, months) +
      this.futureValueOfContributions(monthlyContribution, monthlyRate, months)
    )
  },

  /**
   * Patrimônio necessário para retirar uma renda mensal indefinidamente,
   * consumindo apenas os rendimentos (perpetuidade).
   * C = renda / i
   */
  requiredCapitalForIncome(monthlyIncome, monthlyRate) {
    if (monthlyRate <= 0) return Infinity
    return monthlyIncome / monthlyRate
  },

  /**
   * Número de meses para um patrimônio partindo de `principal`, com aportes
   * mensais `contribution` e taxa `monthlyRate`, atingir `target`.
   * Resolve target = P*x + PMT*(x-1)/i, com x = (1+i)^n.
   */
  monthsToReachTarget(principal, monthlyContribution, monthlyRate, target) {
    if (target <= principal) return 0
    if (monthlyRate === 0) {
      if (monthlyContribution <= 0) return Infinity
      return (target - principal) / monthlyContribution
    }
    const i = monthlyRate
    const numerator = target * i + monthlyContribution
    const denominator = principal * i + monthlyContribution
    if (denominator <= 0) return Infinity
    const x = numerator / denominator
    if (x <= 0) return Infinity
    return Math.log(x) / Math.log(1 + i)
  },

  /**
   * Evolução ano a ano do patrimônio. Retorna array de objetos por ano.
   */
  buildYearlyEvolution(principal, monthlyContribution, monthlyRate, months) {
    const totalYears = Math.ceil(months / 12)
    const rows = Array.from({ length: totalYears })
    for (let year = 1; year <= totalYears; year++) {
      const monthsElapsed = Math.min(year * 12, months)
      const balance = this.futureValue(
        principal,
        monthlyContribution,
        monthlyRate,
        monthsElapsed,
      )
      const invested = principal + monthlyContribution * monthsElapsed
      rows[year - 1] = {
        year,
        months: monthsElapsed,
        invested,
        interest: balance - invested,
        balance,
      }
    }
    return rows
  },
}

/* =====================================================================
   UTILITÁRIOS DE FORMATAÇÃO / PARSING
   ===================================================================== */
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const Format = {
  currency(value) {
    if (!isFinite(value)) return '—'
    return currencyFormatter.format(value)
  },
  number(value, decimals = 2) {
    if (!isFinite(value)) return '—'
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  },
  /** Converte "1.234,56" ou "1234,56" em número. */
  parseNumber(value) {
    if (typeof value !== 'string') return value || 0
    const cleaned = value
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  },
  /** Converte meses (possivelmente fracionários) em texto "X anos e Y meses". */
  monthsToText(months) {
    if (!isFinite(months)) return 'nunca (juros insuficientes)'
    const rounded = Math.ceil(months)
    const years = Math.floor(rounded / 12)
    const rest = rounded % 12
    const parts = []
    if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`)
    if (rest > 0) parts.push(`${rest} ${rest === 1 ? 'mês' : 'meses'}`)
    return parts.length ? parts.join(' e ') : '0 meses'
  },
}

/* =====================================================================
   CONTROLADOR DE UI
   ===================================================================== */
class JurosCompostosCalculadora {
  constructor() {
    this.init()
  }

  init() {
    this.setupTabs()
    this.setupMoneyMasks()
    this.setupActions()
  }

  setupTabs() {
    const buttons = document.querySelectorAll('.tab-button')
    const contents = document.querySelectorAll('.tab-content')
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.getAttribute('data-tab')
        buttons.forEach((b) => b.classList.remove('active'))
        contents.forEach((c) => c.classList.remove('active'))
        button.classList.add('active')
        document.getElementById(target).classList.add('active')
      })
    })
  }

  /** Máscara de moeda (R$) para campos marcados com data-money. */
  setupMoneyMasks() {
    document.querySelectorAll('input[data-money]').forEach((input) => {
      input.addEventListener('input', () => {
        const digits = input.value.replace(/\D/g, '')
        if (!digits) {
          input.value = ''
          return
        }
        const value = parseInt(digits, 10) / 100
        input.value = numberFormatter.format(value)
      })
    })
  }

  setupActions() {
    this.bind('calcJurosBtn', () => this.calcularJuros())
    this.bind('calcRendaBtn', () => this.calcularViverDeRenda())
    this.bind('calcCompararBtn', () => this.compararInvestimentos())
    this.bind('calcAposentadoriaBtn', () => this.calcularAposentadoria())
  }

  bind(id, handler) {
    const el = document.getElementById(id)
    if (el) el.addEventListener('click', handler)
  }

  val(id) {
    const el = document.getElementById(id)
    return el ? Format.parseNumber(el.value) : 0
  }

  /** Lê taxa de um par input+select e devolve taxa mensal (decimal). */
  monthlyRateFrom(inputId, periodId) {
    const rate = this.val(inputId)
    const period = document.getElementById(periodId)?.value || 'anual'
    return period === 'mensal' ? rate / 100 : JurosMath.annualToMonthly(rate)
  }

  /** Lê tempo de um par input+select e devolve total de meses. */
  monthsFrom(inputId, periodId) {
    const time = this.val(inputId)
    const period = document.getElementById(periodId)?.value || 'anos'
    return period === 'meses' ? time : time * 12
  }

  setText(id, text) {
    const el = document.getElementById(id)
    if (el) el.textContent = text
  }

  show(id) {
    const el = document.getElementById(id)
    if (el) {
      el.style.display = 'block'
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }

  /* --------------------------- Aba 1: Juros --------------------------- */
  calcularJuros() {
    const principal = this.val('jurosAporteInicial')
    const monthly = this.val('jurosAporteMensal')
    const rate = this.monthlyRateFrom('jurosTaxa', 'jurosTaxaPeriodo')
    const months = this.monthsFrom('jurosTempo', 'jurosTempoPeriodo')

    if (months <= 0) {
      alert('Informe um período válido.')
      return
    }

    const total = JurosMath.futureValue(principal, monthly, rate, months)
    const invested = principal + monthly * months
    const interest = total - invested

    this.setText('jurosMontante', Format.currency(total))
    this.setText('jurosInvestido', Format.currency(invested))
    this.setText('jurosJuros', Format.currency(interest))
    this.setText(
      'jurosTaxaMensalInfo',
      `Taxa mensal equivalente: ${Format.number(rate * 100, 3)}%`,
    )

    this.renderEvolution(
      JurosMath.buildYearlyEvolution(principal, monthly, rate, months),
    )
    this.show('jurosResultado')
  }

  renderEvolution(rows) {
    const tbody = document.getElementById('jurosEvolucaoBody')
    if (!tbody) return
    tbody.textContent = ''

    for (const r of rows) {
      const tr = document.createElement('tr')

      const tdYear = document.createElement('td')
      tdYear.textContent = `${r.year}º`
      tr.appendChild(tdYear)

      const tdInvested = document.createElement('td')
      tdInvested.textContent = Format.currency(r.invested)
      tr.appendChild(tdInvested)

      const tdInterest = document.createElement('td')
      tdInterest.textContent = Format.currency(r.interest)
      tr.appendChild(tdInterest)

      const tdBalance = document.createElement('td')
      tdBalance.textContent = Format.currency(r.balance)
      tr.appendChild(tdBalance)

      tbody.appendChild(tr)
    }
  }

  /* ----------------------- Aba 2: Viver de renda ---------------------- */
  calcularViverDeRenda() {
    const income = this.val('rendaDesejada')
    const rate = this.monthlyRateFrom('rendaTaxa', 'rendaTaxaPeriodo')

    if (income <= 0) {
      alert('Informe a renda mensal desejada.')
      return
    }

    const capital = JurosMath.requiredCapitalForIncome(income, rate)
    this.setText('rendaPatrimonio', Format.currency(capital))
    this.setText(
      'rendaExplicacao',
      `Com ${Format.number(rate * 100, 3)}% ao mês, esse patrimônio rende ` +
        `${Format.currency(income)} por mês sem consumir o principal.`,
    )

    // Tempo para atingir o patrimônio (opcional)
    const principal = this.val('rendaAporteInicial')
    const monthly = this.val('rendaAporteMensal')
    if (monthly > 0 || principal > 0) {
      const months = JurosMath.monthsToReachTarget(
        principal,
        monthly,
        rate,
        capital,
      )
      this.setText(
        'rendaTempo',
        `Aportando ${Format.currency(monthly)}/mês (início ${Format.currency(
          principal,
        )}): ${Format.monthsToText(months)} para chegar lá.`,
      )
    } else {
      this.setText('rendaTempo', '')
    }

    this.show('rendaResultado')
  }

  /* ---------------------- Aba 3: Comparador --------------------------- */
  compararInvestimentos() {
    const principal = this.val('compararAporteInicial')
    const monthly = this.val('compararAporteMensal')
    const months = this.monthsFrom('compararTempo', 'compararTempoPeriodo')

    if (months <= 0) {
      alert('Informe um período válido.')
      return
    }

    const rateA = this.monthlyRateFrom('compararTaxaA', 'compararTaxaAPeriodo')
    const rateB = this.monthlyRateFrom('compararTaxaB', 'compararTaxaBPeriodo')

    const totalA = JurosMath.futureValue(principal, monthly, rateA, months)
    const totalB = JurosMath.futureValue(principal, monthly, rateB, months)
    const diff = Math.abs(totalA - totalB)
    const winner = totalA === totalB ? null : totalA > totalB ? 'A' : 'B'

    this.setText('compararMontanteA', Format.currency(totalA))
    this.setText('compararMontanteB', Format.currency(totalB))

    let verdict
    if (!winner) {
      verdict = 'Os dois investimentos rendem o mesmo valor.'
    } else {
      verdict = `Investimento ${winner} rende ${Format.currency(diff)} a mais no período.`
    }
    this.setText('compararVeredito', verdict)

    document
      .getElementById('compararCardA')
      ?.classList.toggle('winner', winner === 'A')
    document
      .getElementById('compararCardB')
      ?.classList.toggle('winner', winner === 'B')

    this.show('compararResultado')
  }

  /* --------------------- Aba 4: Aposentadoria ------------------------- */
  calcularAposentadoria() {
    const idadeAtual = this.val('aposIdadeAtual')
    const idadeAposentar = this.val('aposIdadeAposentar')
    const principal = this.val('aposAporteInicial')
    const monthly = this.val('aposAporteMensal')
    const rate = this.monthlyRateFrom('aposTaxa', 'aposTaxaPeriodo')
    const rendaDesejada = this.val('aposRendaDesejada')

    const anos = idadeAposentar - idadeAtual
    if (anos <= 0) {
      alert('A idade de aposentadoria deve ser maior que a idade atual.')
      return
    }

    const months = anos * 12
    const patrimonio = JurosMath.futureValue(principal, monthly, rate, months)
    const rendaGerada = patrimonio * rate
    const patrimonioNecessario = JurosMath.requiredCapitalForIncome(
      rendaDesejada,
      rate,
    )

    this.setText('aposPatrimonio', Format.currency(patrimonio))
    this.setText('aposRendaGerada', Format.currency(rendaGerada))
    this.setText(
      'aposResumo',
      `Em ${anos} ${anos === 1 ? 'ano' : 'anos'} você acumula ` +
        `${Format.currency(patrimonio)}, gerando ` +
        `${Format.currency(rendaGerada)}/mês de renda passiva.`,
    )

    if (rendaDesejada > 0) {
      const falta = patrimonioNecessario - patrimonio
      if (falta <= 0) {
        this.setText(
          'aposMeta',
          `✅ Meta atingida! Seu patrimônio supera os ` +
            `${Format.currency(patrimonioNecessario)} necessários para uma ` +
            `renda de ${Format.currency(rendaDesejada)}/mês.`,
        )
      } else {
        const extra = this.aporteExtraParaMeta(
          principal,
          rate,
          months,
          patrimonioNecessario,
        )
        this.setText(
          'aposMeta',
          `⚠️ Para ter ${Format.currency(rendaDesejada)}/mês você precisa de ` +
            `${Format.currency(patrimonioNecessario)} (faltam ` +
            `${Format.currency(falta)}). Aporte necessário: ` +
            `${Format.currency(extra)}/mês.`,
        )
      }
    } else {
      this.setText('aposMeta', '')
    }

    this.show('aposResultado')
  }

  /** Aporte mensal necessário para atingir `target` no prazo dado. */
  aporteExtraParaMeta(principal, monthlyRate, months, target) {
    const fromPrincipal = JurosMath.compoundInterest(
      principal,
      monthlyRate,
      months,
    )
    const remaining = target - fromPrincipal
    if (remaining <= 0) return 0
    const factor = JurosMath.futureValueOfContributions(1, monthlyRate, months)
    if (factor <= 0) return Infinity
    return remaining / factor
  }
}

// Inicializar quando o DOM estiver carregado
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new JurosCompostosCalculadora()
  })
}

// Exportar para testes (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JurosMath, Format, JurosCompostosCalculadora }
}
