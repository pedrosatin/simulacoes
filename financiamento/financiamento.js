// =============================================
// SIMULADOR DE FINANCIAMENTO — INVESTIR VS AMORTIZAR
// =============================================

// Configurações gerais
const CONFIG = {
  API_SELIC_URL:
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json',
  FALLBACK_SELIC_RATE: 13.75, // Taxa de fallback caso a API falhe
  CACHE_DURATION: 60 * 60 * 1000, // 1 hora em milliseconds
  MAX_PARCELAS: 480,
  NEWTON_RAPHSON_TOLERANCIA: 1e-9,
  NEWTON_RAPHSON_MAX_ITER: 1000,
}

// Cache da taxa Selic
let selicCache = {
  rate: null,
  date: null,
  timestamp: null,
}

// =============================================
// UTILITÁRIOS
// =============================================
const Utils = {
  // Formatar valor monetário
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  },

  // Formatar valor para input (R$ 1.234,56)
  formatCurrencyInput(value) {
    if (!value && value !== 0) return ''
    const numericValue = typeof value === 'string' ? this.parseCurrencyInput(value) : value
    if (isNaN(numericValue)) return ''
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue)
  },

  // Converter valor formatado brasileiro para número
  parseCurrencyInput(value) {
    if (typeof value !== 'string') return parseFloat(value) || 0
    let cleaned = value.replace(/[R$\s]/g, '')
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  },

  // Aplicar máscara monetária em tempo real (padrão "centavos")
  // Remove não-dígitos, trata como centavos e reformata — sem manipular cursor
  applyCurrencyMask(input) {
    let value = input.value

    // Mantém apenas dígitos
    value = value.replace(/\D/g, '')

    // Interpreta como centavos: "10000" → R$ 100,00
    value = (parseInt(value) || 0) / 100

    input.value = this.formatCurrencyInput(value)

    return value
  },

  // Obter valor numérico de um input
  getNumericValue(input) {
    return this.parseCurrencyInput(input.value)
  },

  // Formatar percentual
  formatPercent(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`
  },

  // Validar número positivo
  isValidPositiveNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value) && value > 0
  },

  // Formatar número com separadores brasileiros
  formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  },

  // Exibir mensagem de erro simples
  showError(message) {
    alert(message)
  },
}

// =============================================
// API SELIC (Banco Central do Brasil)
// =============================================
const SelicAPI = {
  // Obter taxa Selic com cache
  async getSelicRate() {
    const agora = Date.now()

    // Verificar cache válido
    if (selicCache.rate && selicCache.timestamp && (agora - selicCache.timestamp) < CONFIG.CACHE_DURATION) {
      return { rate: selicCache.rate, date: selicCache.date }
    }

    try {
      const response = await fetch(CONFIG.API_SELIC_URL)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      if (!data || !data.length) throw new Error('Dados inválidos da API')

      const taxa = parseFloat(data[0].valor)
      const data_ref = data[0].data

      // Atualizar cache
      selicCache = { rate: taxa, date: data_ref, timestamp: agora }
      return { rate: taxa, date: data_ref }
    } catch (error) {
      console.error('Erro ao buscar Selic:', error)
      return { rate: CONFIG.FALLBACK_SELIC_RATE, date: null }
    }
  },

  // Atualizar display da Selic na tela
  async updateSelicDisplay() {
    const elRate = document.getElementById('selic-display')
    const elDate = document.getElementById('selic-date')
    if (!elRate) return

    try {
      const { rate, date } = await this.getSelicRate()
      elRate.textContent = `${rate.toFixed(2)}% a.a.`
      if (elDate && date) {
        // API retorna data no formato dd/mm/aaaa
        elDate.textContent = `(ref. ${date})`
      }
    } catch (error) {
      console.error('Erro ao exibir Selic:', error)
      elRate.textContent = `${CONFIG.FALLBACK_SELIC_RATE.toFixed(2)}% a.a.`
      if (elDate) elDate.textContent = 'Taxa de referência'
    }
  },
}

// =============================================
// CALCULADORA FINANCEIRA
// =============================================
const FinancialCalculator = {

  // -------- Taxa implícita via Newton-Raphson --------
  // Dado principal P, parcela PMT e n períodos, resolve para i (taxa mensal)
  calcImplicitRate(principal, pmt, n) {
    if (principal <= 0 || pmt <= 0 || n <= 0) return null

    // Validação básica: PMT * n deve ser maior que principal
    if (pmt * n <= principal) return null

    // Chute inicial
    let i = (pmt * n / principal - 1) / n

    // Garantir chute positivo e razoável
    if (i <= 0 || !isFinite(i)) i = 0.01

    for (let iter = 0; iter < CONFIG.NEWTON_RAPHSON_MAX_ITER; iter++) {
      const fator = Math.pow(1 + i, n)

      // f(i) = PMT * (1 - (1+i)^-n) / i - P
      const fi = pmt * (1 - 1 / fator) / i - principal

      // f'(i) via diferença finita (mais estável numericamente)
      const h = i * 1e-6
      const fatorH = Math.pow(1 + i + h, n)
      const fiH = pmt * (1 - 1 / fatorH) / (i + h) - principal
      const dfi = (fiH - fi) / h

      if (Math.abs(dfi) < 1e-15) break

      const iNovo = i - fi / dfi

      if (Math.abs(iNovo - i) < CONFIG.NEWTON_RAPHSON_TOLERANCIA) {
        return iNovo > 0 ? iNovo : null
      }
      i = iNovo > 0 ? iNovo : i / 2
    }

    return i > 0 ? i : null
  },

  // -------- Calcular PMT (Tabela Price) --------
  calcPMT(principal, taxaMensal, n) {
    if (taxaMensal === 0) return principal / n
    const fator = Math.pow(1 + taxaMensal, n)
    return principal * taxaMensal * fator / (fator - 1)
  },

  // -------- Schedule Tabela Price --------
  buildPriceSchedule(principal, taxaMensal, n) {
    const pmt = this.calcPMT(principal, taxaMensal, n)
    const schedule = []
    let saldo = principal

    for (let mes = 1; mes <= n; mes++) {
      const juros = saldo * taxaMensal
      const amortizacao = pmt - juros
      saldo = Math.max(0, saldo - amortizacao)

      schedule.push({
        month: mes,
        payment: pmt,
        interest: juros,
        amortization: amortizacao,
        balance: saldo,
      })
    }

    return schedule
  },

  // -------- Schedule SAC --------
  buildSACSchedule(principal, taxaMensal, n) {
    const amortizacaoConstante = principal / n
    const schedule = []
    let saldo = principal

    for (let mes = 1; mes <= n; mes++) {
      const juros = saldo * taxaMensal
      const pagamento = amortizacaoConstante + juros
      saldo = Math.max(0, saldo - amortizacaoConstante)

      schedule.push({
        month: mes,
        payment: pagamento,
        interest: juros,
        amortization: amortizacaoConstante,
        balance: saldo,
      })
    }

    return schedule
  },

  // -------- Custo de antecipar parcela n no mês atual --------
  // parcelas são 1-indexed; currentMonth é o mês corrente (1-indexed)
  calcEarlyRepaymentCost(pmt, taxaMensal, futureParcela, currentMonth) {
    const mesesAntecipados = futureParcela - currentMonth
    if (mesesAntecipados <= 0) return { cost: pmt, discount: 0, discountPercent: 0 }

    const custo = pmt / Math.pow(1 + taxaMensal, mesesAntecipados)
    const desconto = pmt - custo
    const descontoPct = (desconto / pmt) * 100

    return { cost: custo, discount: desconto, discountPercent: descontoPct }
  },

  // -------- Alíquota IR regressivo sobre investimentos --------
  // Lei 11.033/2004 — tabela regressiva
  aliquotaIR(diasAplicado) {
    if (diasAplicado <= 180) return 0.225
    if (diasAplicado <= 360) return 0.20
    if (diasAplicado <= 720) return 0.175
    return 0.15
  },

  // -------- Simular estratégia INVESTIR --------
  // Cada mês aplica `extraMensal`; saca tudo ao final do financiamento
  simulateInvestment(extraMensal, taxaAnualPct, totalMeses) {
    const taxaMensal = Math.pow(1 + taxaAnualPct / 100, 1 / 12) - 1
    let totalInvestido = 0
    let totalBruto = 0 // saldo bruto final

    // Cada aporte rende separadamente por (totalMeses - mes) meses
    const aportes = []
    for (let mes = 1; mes <= totalMeses; mes++) {
      const mesesAplicado = totalMeses - mes + 1
      const diasAplicado = mesesAplicado * 30
      const rendimentoBruto = extraMensal * Math.pow(1 + taxaMensal, mesesAplicado)
      const ganho = rendimentoBruto - extraMensal
      const ir = ganho * this.aliquotaIR(diasAplicado)
      const rendimentoLiquido = extraMensal + ganho - ir

      aportes.push({ mes, mesesAplicado, diasAplicado, rendimentoLiquido, ganho, ir })
      totalInvestido += extraMensal
      totalBruto += rendimentoBruto
    }

    const totalGanhoBruto = totalBruto - totalInvestido
    const totalIR = aportes.reduce((acc, a) => acc + a.ir, 0)
    const totalRetornoLiquido = aportes.reduce((acc, a) => acc + a.rendimentoLiquido, 0)

    return {
      totalInvestido,
      grossReturn: totalGanhoBruto,
      irTax: totalIR,
      netReturn: totalRetornoLiquido - totalInvestido, // lucro líquido
      finalBalance: totalRetornoLiquido, // saldo final (capital + lucro líquido)
    }
  },

  // -------- Simular estratégia AMORTIZAR --------
  // A cada mês usa `extraMensal` para antecipar parcelas mais distantes (maior desconto)
  simulateAmortization(schedule, extraMensal, taxaMensal) {
    const n = schedule.length
    // Rastrear quais parcelas já foram pagas (antecipadas ou normais)
    const paid = new Array(n + 1).fill(false) // 1-indexed

    let totalPago = 0
    let totalDesconto = 0
    let parcelasAntecipadas = 0

    for (let mes = 1; mes <= n; mes++) {
      // Pular parcela atual se já foi antecipada
      if (!paid[mes]) {
        totalPago += schedule[mes - 1].payment
        paid[mes] = true
      }

      // Usar extra para antecipar parcelas mais distantes possíveis
      let saldoExtra = extraMensal
      // Percorrer do fim para o início (maior desconto primeiro)
      for (let futura = n; futura > mes && saldoExtra > 0; futura--) {
        if (paid[futura]) continue

        const { cost } = this.calcEarlyRepaymentCost(
          schedule[futura - 1].payment,
          taxaMensal,
          futura,
          mes
        )

        if (cost <= saldoExtra) {
          saldoExtra -= cost
          totalPago += cost
          totalDesconto += schedule[futura - 1].payment - cost
          paid[futura] = true
          parcelasAntecipadas++
        }
      }

      // Qualquer extra não utilizado não gera retorno (assume-se que é guardado sem rendimento)
      // Para comparação justa, somamos o não utilizado ao custo total (ele "existe" mas não rende)
    }

    return {
      totalPaid: totalPago,
      totalDiscount: totalDesconto,
      installmentsEliminated: parcelasAntecipadas,
    }
  },

  // -------- Comparar as duas estratégias --------
  compareStrategies(schedule, investResult, amortResult, extraMensal) {
    // Custo total no cenário INVESTIR:
    // Pagou todas as parcelas normais + investiu extra → subtrai retorno líquido do investimento
    const totalParcelasNormais = schedule.reduce((acc, s) => acc + s.payment, 0)
    const totalExtraTotalInvestido = extraMensal * schedule.length

    // Custo efetivo investir: parcelas - retorno líquido do investimento (o retorno abate o custo)
    const custoEfetivoInvestir = totalParcelasNormais + totalExtraTotalInvestido - investResult.finalBalance

    // Custo efetivo amortizar: total efetivamente pago (parcelas normais no prazo + antecipações com desconto)
    // Parcelas antecipadas já entram em totalPaid pelo seu valor presente (descontado)
    const custoAmortizar = amortResult.totalPaid

    const economia = Math.abs(custoEfetivoInvestir - custoAmortizar)
    const melhorEstrategia = custoEfetivoInvestir <= custoAmortizar ? 'investir' : 'amortizar'

    const economiaPercent = (economia / Math.max(custoEfetivoInvestir, custoAmortizar)) * 100

    let recomendacao
    if (melhorEstrategia === 'investir') {
      recomendacao = `Investir o valor extra é mais vantajoso neste cenário. O retorno líquido do investimento (pós-IR) supera o benefício dos descontos de amortização, gerando uma economia de ${Utils.formatCurrency(economia)} (${Utils.formatPercent(economiaPercent)}) em relação à estratégia de amortizar.`
    } else {
      recomendacao = `Amortizar o financiamento é mais vantajoso neste cenário. Os descontos obtidos ao antecipar parcelas superam o retorno líquido do investimento (pós-IR), gerando uma economia de ${Utils.formatCurrency(economia)} (${Utils.formatPercent(economiaPercent)}) em relação à estratégia de investir.`
    }

    return {
      betterStrategy: melhorEstrategia,
      custoInvestir: custoEfetivoInvestir,
      custoAmortizar,
      savings: economia,
      savingsPercent: economiaPercent,
      totalParcelasNormais,
      recommendation: recomendacao,
    }
  },

  // -------- Gerar tabela comparativa mês a mês --------
  buildMonthlyComparison(schedule, extraMensal, taxaInvestimentoMensal, taxaMensal) {
    const n = schedule.length
    const rows = []

    // Estado investir
    let saldoInvestimento = 0

    // Estado amortizar (clone do schedule para simular liquidação)
    const paid = new Array(n + 1).fill(false)
    let saldoDevedorAmortizar = schedule[0] ? schedule[0].balance + schedule[0].amortization : 0

    for (let mes = 1; mes <= n; mes++) {
      const parcelaNormal = schedule[mes - 1].payment

      // --- Cenário investir ---
      // O saldo anterior rende por mais 1 mês, depois soma o novo aporte
      saldoInvestimento = saldoInvestimento * (1 + taxaInvestimentoMensal) + extraMensal

      // --- Cenário amortizar ---
      // Pagar parcela normal se não antecipada
      let saldoDevedorAtual = schedule[mes - 1].balance

      // Usar extra para antecipar a parcela mais distante possível
      let saldoExtra = extraMensal
      for (let futura = n; futura > mes && saldoExtra > 0; futura--) {
        if (paid[futura]) continue
        const { cost } = this.calcEarlyRepaymentCost(
          schedule[futura - 1].payment,
          taxaMensal,
          futura,
          mes
        )
        if (cost <= saldoExtra) {
          saldoExtra -= cost
          paid[futura] = true
          // Reduzir saldo devedor pelo valor nominal da parcela antecipada
          saldoDevedorAtual = Math.max(0, saldoDevedorAtual - schedule[futura - 1].amortization)
        }
      }

      // Diferença: saldo_investimento - saldo_devedor_amortizar
      const diferenca = saldoInvestimento - saldoDevedorAtual

      rows.push({
        month: mes,
        payment: parcelaNormal,
        investBalance: saldoInvestimento,
        amortBalance: saldoDevedorAtual,
        diff: diferenca,
      })
    }

    return rows
  },
}

// =============================================
// CONTROLADOR DA SIMULAÇÃO
// =============================================
const SimulationController = {
  // Dados da simulação atual
  currentData: null,

  // Inicializar
  async init() {
    await SelicAPI.updateSelicDisplay()
    this.bindEvents()
    this.setupFormValidation()
  },

  // Configurar eventos
  bindEvents() {
    const form = document.getElementById('simulationForm')
    if (form) form.addEventListener('submit', this.handleFormSubmit.bind(this))

    // Auto-cálculo de PMT quando principal + n + taxa mudam
    ;['principal', 'n-parcelas', 'taxa-anual'].forEach((id) => {
      const el = document.getElementById(id)
      if (el) el.addEventListener('input', this.handleAutoCalc.bind(this))
    })

    // Auto-cálculo de taxa quando principal + n + PMT mudam
    document.getElementById('pmt')?.addEventListener('input', this.handleAutoCalc.bind(this))

    // Sistema muda → recalcular
    document.getElementById('sistema')?.addEventListener('change', this.handleAutoCalc.bind(this))

    // Controle de abas
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.currentTarget.dataset.tab)
      })
    })
  },

  // Configurar máscaras e validações
  setupFormValidation() {
    ;['principal', 'pmt', 'extra-mensal', 'taxa-investimento', 'taxa-anual'].forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return

      // Campos monetários: máscara no input, reformat no blur
      if (['principal', 'pmt', 'extra-mensal'].includes(id)) {
        el.addEventListener('input', () => Utils.applyCurrencyMask(el))
        el.addEventListener('blur', (e) => {
          // Garante formatação completa ao sair do campo
          const v = Utils.parseCurrencyInput(e.target.value)
          e.target.value = v > 0 ? Utils.formatCurrencyInput(v) : ''
        })
      }

      // Campos de percentual
      if (['taxa-anual', 'taxa-investimento'].includes(id)) {
        el.addEventListener('input', (e) => {
          // Permitir apenas números e vírgula/ponto
          e.target.value = e.target.value.replace(/[^0-9.,]/g, '')
        })
      }
    })

    // Limitar parcelas
    const elN = document.getElementById('n-parcelas')
    if (elN) {
      elN.addEventListener('input', (e) => {
        let v = parseInt(e.target.value.replace(/\D/g, '')) || ''
        if (v > CONFIG.MAX_PARCELAS) v = CONFIG.MAX_PARCELAS
        if (v < 0) v = ''
        e.target.value = v
      })
    }
  },

  // Auto-cálculo: PMT ↔ taxa
  handleAutoCalc() {
    const principal = Utils.parseCurrencyInput(document.getElementById('principal')?.value || '')
    const n = parseInt(document.getElementById('n-parcelas')?.value) || 0
    const pmtInput = Utils.parseCurrencyInput(document.getElementById('pmt')?.value || '')
    const taxaInput = parseFloat((document.getElementById('taxa-anual')?.value || '').replace(',', '.')) || 0
    const preview = document.getElementById('calc-preview')

    if (!preview) return
    if (!Utils.isValidPositiveNumber(principal) || n <= 0) {
      preview.style.display = 'none'
      return
    }

    // Se tiver PMT mas não taxa → calcular taxa
    if (pmtInput > 0 && taxaInput === 0) {
      const taxaMensal = FinancialCalculator.calcImplicitRate(principal, pmtInput, n)
      if (taxaMensal) {
        const taxaAnual = (Math.pow(1 + taxaMensal, 12) - 1) * 100
        preview.innerHTML = `
          <span class="preview-icon">🧮</span>
          <span>Taxa calculada: <strong>${Utils.formatPercent(taxaMensal * 100, 4)} a.m.</strong> / <strong>${Utils.formatPercent(taxaAnual, 2)} a.a.</strong></span>
        `
        preview.style.display = 'flex'
        // Preencher campo taxa silenciosamente
        const elTaxa = document.getElementById('taxa-anual')
        if (elTaxa && document.activeElement !== elTaxa) {
          elTaxa.value = taxaAnual.toFixed(2).replace('.', ',')
        }
      } else {
        preview.style.display = 'none'
      }
      return
    }

    // Se tiver taxa mas não PMT → calcular PMT
    if (taxaInput > 0) {
      const taxaMensal = Math.pow(1 + taxaInput / 100, 1 / 12) - 1
      const pmt = FinancialCalculator.calcPMT(principal, taxaMensal, n)
      if (pmt > 0) {
        preview.innerHTML = `
          <span class="preview-icon">🧮</span>
          <span>Parcela calculada: <strong>${Utils.formatCurrency(pmt)}</strong></span>
        `
        preview.style.display = 'flex'
        // Preencher campo PMT silenciosamente
        const elPMT = document.getElementById('pmt')
        if (elPMT && document.activeElement !== elPMT) {
          elPMT.value = Utils.formatCurrencyInput(pmt)
        }
      } else {
        preview.style.display = 'none'
      }
    }
  },

  // Alternar abas
  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId)
    })
    document.querySelectorAll('.tab-content').forEach((content) => {
      content.style.display = content.id === `tab-${tabId}` ? 'block' : 'none'
    })
  },

  // Submit do formulário
  async handleFormSubmit(e) {
    e.preventDefault()
    if (!this.validateForm()) return
    await this.performSimulation()
  },

  // Validar formulário
  validateForm() {
    const principal = Utils.parseCurrencyInput(document.getElementById('principal')?.value || '')
    const n = parseInt(document.getElementById('n-parcelas')?.value) || 0
    const extraMensal = Utils.parseCurrencyInput(document.getElementById('extra-mensal')?.value || '')

    if (!Utils.isValidPositiveNumber(principal)) {
      Utils.showError('Por favor, informe um valor financiado válido.')
      return false
    }
    if (n < 1 || n > CONFIG.MAX_PARCELAS) {
      Utils.showError(`Número de parcelas deve ser entre 1 e ${CONFIG.MAX_PARCELAS}.`)
      return false
    }
    if (!Utils.isValidPositiveNumber(extraMensal)) {
      Utils.showError('Por favor, informe o valor extra disponível por mês.')
      return false
    }

    // Precisa de taxa ou PMT
    const pmt = Utils.parseCurrencyInput(document.getElementById('pmt')?.value || '')
    const taxa = parseFloat((document.getElementById('taxa-anual')?.value || '').replace(',', '.')) || 0
    if (!Utils.isValidPositiveNumber(pmt) && taxa <= 0) {
      Utils.showError('Informe a taxa de juros anual ou o valor da parcela.')
      return false
    }

    return true
  },

  // Executar simulação
  async performSimulation() {
    try {
      document.getElementById('simulationForm')?.classList.add('loading')

      // Coletar inputs
      const principal = Utils.parseCurrencyInput(document.getElementById('principal').value)
      const n = parseInt(document.getElementById('n-parcelas').value)
      const extraMensal = Utils.parseCurrencyInput(document.getElementById('extra-mensal').value)
      const sistema = document.getElementById('sistema')?.value || 'price'

      // Taxa do financiamento
      let taxaAnualFinanciamento = parseFloat((document.getElementById('taxa-anual')?.value || '').replace(',', '.')) || 0
      let pmtInformado = Utils.parseCurrencyInput(document.getElementById('pmt')?.value || '')

      // Calcular taxa ou PMT faltantes
      let taxaMensal
      let pmt

      if (pmtInformado > 0 && taxaAnualFinanciamento <= 0) {
        taxaMensal = FinancialCalculator.calcImplicitRate(principal, pmtInformado, n)
        if (!taxaMensal) {
          Utils.showError('Não foi possível calcular a taxa implícita. Verifique os valores informados.')
          return
        }
        taxaAnualFinanciamento = (Math.pow(1 + taxaMensal, 12) - 1) * 100
        pmt = pmtInformado
      } else {
        taxaMensal = Math.pow(1 + taxaAnualFinanciamento / 100, 1 / 12) - 1
        pmt = FinancialCalculator.calcPMT(principal, taxaMensal, n)
      }

      // Taxa de investimento (Selic se não informada)
      let taxaInvestimento = parseFloat((document.getElementById('taxa-investimento')?.value || '').replace(',', '.'))
      if (!taxaInvestimento || taxaInvestimento <= 0) {
        const { rate } = await SelicAPI.getSelicRate()
        taxaInvestimento = rate
      }
      const taxaInvestimentoMensal = Math.pow(1 + taxaInvestimento / 100, 1 / 12) - 1

      // Gerar schedule
      const schedule = sistema === 'sac'
        ? FinancialCalculator.buildSACSchedule(principal, taxaMensal, n)
        : FinancialCalculator.buildPriceSchedule(principal, taxaMensal, n)

      // Simulações
      const investResult = FinancialCalculator.simulateInvestment(extraMensal, taxaInvestimento, n)
      const amortResult = FinancialCalculator.simulateAmortization(schedule, extraMensal, taxaMensal)
      const comparison = FinancialCalculator.compareStrategies(schedule, investResult, amortResult, extraMensal)
      const monthlyRows = FinancialCalculator.buildMonthlyComparison(schedule, extraMensal, taxaInvestimentoMensal, taxaMensal)

      // Guardar dados para uso nas abas
      this.currentData = {
        schedule,
        investResult,
        amortResult,
        comparison,
        monthlyRows,
        taxaMensal,
        taxaAnualFinanciamento,
        taxaInvestimento,
        pmt,
        n,
        principal,
        extraMensal,
      }

      this.displayResults()
    } catch (error) {
      Utils.showError('Erro ao realizar simulação. Tente novamente.')
      console.error('Erro na simulação:', error)
    } finally {
      document.getElementById('simulationForm')?.classList.remove('loading')
    }
  },

  // Exibir resultados
  displayResults() {
    const d = this.currentData
    if (!d) return

    const { comparison, investResult, amortResult, schedule, taxaMensal, taxaAnualFinanciamento, taxaInvestimento } = d

    // Recomendação
    const recCard = document.getElementById('resultado-recomendacao')
    const isBetterInvest = comparison.betterStrategy === 'investir'
    if (recCard) {
      recCard.className = 'recommendation-card ' + (isBetterInvest ? 'better-invest' : 'better-amortize')
    }
    const el = (id) => document.getElementById(id)

    const icon = isBetterInvest ? '📈' : '🏦'
    const titulo = isBetterInvest ? 'Melhor estratégia: Investir' : 'Melhor estratégia: Amortizar'
    if (el('rec-title')) el('rec-title').textContent = `${icon} ${titulo}`
    if (el('rec-text')) el('rec-text').textContent = comparison.recommendation
    if (el('rec-label')) el('rec-label').textContent = 'Economia estimada:'
    if (el('resultado-economia')) el('resultado-economia').textContent =
      `${Utils.formatCurrency(comparison.savings)} (${Utils.formatPercent(comparison.savingsPercent)})`

    // Cards comparativos
    const totalParcelasNormais = schedule.reduce((acc, s) => acc + s.payment, 0)
    if (el('invest-total-parcelas')) el('invest-total-parcelas').textContent = Utils.formatCurrency(totalParcelasNormais)
    if (el('invest-total-investido')) el('invest-total-investido').textContent = Utils.formatCurrency(investResult.totalInvestido)
    if (el('invest-retorno-liquido')) el('invest-retorno-liquido').textContent = `+${Utils.formatCurrency(investResult.netReturn)}`
    if (el('resultado-investir-total')) el('resultado-investir-total').textContent = Utils.formatCurrency(comparison.custoInvestir)

    if (el('amort-parcelas-normais')) el('amort-parcelas-normais').textContent = Utils.formatCurrency(totalParcelasNormais)
    if (el('amort-desconto-total')) el('amort-desconto-total').textContent = `+${Utils.formatCurrency(amortResult.totalDiscount)}`
    if (el('amort-meses-eliminados')) el('amort-meses-eliminados').textContent = `${amortResult.installmentsEliminated} parcelas`
    if (el('resultado-amortizar-total')) el('resultado-amortizar-total').textContent = Utils.formatCurrency(comparison.custoAmortizar)

    // Aba Resumo — métricas
    if (el('info-taxa-mensal')) el('info-taxa-mensal').textContent = Utils.formatPercent(taxaMensal * 100, 4) + ' a.m.'
    if (el('info-taxa-anual')) el('info-taxa-anual').textContent = Utils.formatPercent(taxaAnualFinanciamento, 2) + ' a.a.'
    const totalJuros = schedule.reduce((acc, s) => acc + s.interest, 0)
    if (el('info-total-juros')) el('info-total-juros').textContent = Utils.formatCurrency(totalJuros)
    if (el('info-ir-investimento')) el('info-ir-investimento').textContent = Utils.formatCurrency(investResult.irTax)
    if (el('info-taxa-investimento')) el('info-taxa-investimento').textContent = Utils.formatPercent(taxaInvestimento, 2) + ' a.a.'

    // Aba Tabela de Amortização
    this.renderAmortizationTable(schedule)

    // Aba Comparativo Mês a Mês
    this.renderMonthlyComparison(d.monthlyRows)

    // Exibir seção de resultados
    const resultSection = document.getElementById('resultado-section')
    if (resultSection) {
      resultSection.style.display = 'flex'
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Resetar para aba resumo
    this.switchTab('resumo')
  },

  // Renderizar tabela de amortização
  renderAmortizationTable(schedule) {
    const tbody = document.getElementById('tabela-amortizacao')
    if (!tbody) return

    tbody.innerHTML = schedule.map((row) => `
      <tr>
        <td>${row.month}</td>
        <td>${Utils.formatCurrency(row.payment)}</td>
        <td class="interest-cell">${Utils.formatCurrency(row.interest)}</td>
        <td>${Utils.formatCurrency(row.amortization)}</td>
        <td>${Utils.formatCurrency(row.balance)}</td>
      </tr>
    `).join('')
  },

  // Renderizar comparativo mês a mês
  renderMonthlyComparison(rows) {
    const tbody = document.getElementById('tabela-comparativo')
    if (!tbody) return

    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.month}</td>
        <td>${Utils.formatCurrency(row.payment)}</td>
        <td class="invest-cell">${Utils.formatCurrency(row.investBalance)}</td>
        <td>${Utils.formatCurrency(row.amortBalance)}</td>
        <td class="${row.diff >= 0 ? 'positive-cell' : 'negative-cell'}">
          ${row.diff >= 0 ? '+' : ''}${Utils.formatCurrency(row.diff)}
        </td>
      </tr>
    `).join('')
  },
}

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  SimulationController.init()
})

// Atualizar Selic a cada 30 minutos
setInterval(() => {
  SelicAPI.updateSelicDisplay()
}, 30 * 60 * 1000)

// Exportar para uso global
window.SimuladorFinanciamento = {
  FinancialCalculator,
  SelicAPI,
  Utils,
}
