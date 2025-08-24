// Configurações e constantes
const CONFIG = {
  API_SELIC_URL:
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json', // Meta Selic COPOM
  FALLBACK_SELIC_RATE: 15.0, // Taxa de fallback caso a API falhe (atual)
  CACHE_DURATION: 60 * 60 * 1000, // 1 hora em milliseconds
}

// Cache para a taxa Selic
let selicCache = {
  rate: null,
  date: null,
  timestamp: null,
}

// Elementos DOM
const elements = {
  form: document.getElementById('simulationForm'),
  productValue: document.getElementById('productValue'),
  cashValue: document.getElementById('cashValue'),
  installments: document.getElementById('installments'),
  results: document.getElementById('results'),
  selicRate: document.getElementById('selicRate'),
  selicDate: document.getElementById('selicDate'),
  // Resultados
  cashPayment: document.getElementById('cashPayment'),
  selicInvestment: document.getElementById('selicInvestment'),
  cashTotalCost: document.getElementById('cashTotalCost'),
  installmentValue: document.getElementById('installmentValue'),
  installmentTotal: document.getElementById('installmentTotal'),
  installmentTotalCost: document.getElementById('installmentTotalCost'),
  recommendationTitle: document.getElementById('recommendationTitle'),
  recommendationText: document.getElementById('recommendationText'),
  savingsLabel: document.getElementById('savingsLabel'),
  savingsValue: document.getElementById('savingsValue'),
  savingsPercent: document.getElementById('savingsPercent'),
  monthlySelicRate: document.getElementById('monthlySelicRate'),
  investmentPeriod: document.getElementById('investmentPeriod'),
  grossReturn: document.getElementById('grossReturn'),
}

// Utilitários
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
    if (!value) return ''

    const numericValue = this.parseCurrencyInput(value)
    if (isNaN(numericValue)) return value

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue)
  },

  // Converter valor formatado para número
  parseCurrencyInput(value) {
    if (typeof value !== 'string') return value

    // Remove símbolos monetários e espaços
    let cleaned = value.replace(/[R$\s]/g, '')

    // Substitui vírgula decimal por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')

    return parseFloat(cleaned) || 0
  },

  // Aplicar máscara monetária em tempo real
  applyCurrencyMask(input) {
    let value = input.value

    // Remove tudo exceto números
    value = value.replace(/\D/g, '')

    // Converte para centavos
    value = (parseInt(value) || 0) / 100

    // Formata como moeda
    input.value = this.formatCurrencyInput(value)

    return value
  },

  // Formatar porcentagem
  formatPercent(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`
  },

  // Formatar data
  formatDate(dateString) {
    if (!dateString) return 'Data não disponível'

    // A API do Banco Central retorna no formato dd/mm/aaaa
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/')
      const date = new Date(year, month - 1, day) // month é 0-indexed no JS

      if (isNaN(date.getTime())) {
        return 'Data inválida'
      }

      return date.toLocaleDateString('pt-BR')
    }

    // Fallback para formato ISO
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Data inválida'
    }

    return date.toLocaleDateString('pt-BR')
  },

  // Validar número positivo
  isValidPositiveNumber(value) {
    const numericValue =
      typeof value === 'string' ? this.parseCurrencyInput(value) : value
    return !isNaN(numericValue) && numericValue > 0
  },

  // Obter valor numérico de input formatado
  getNumericValue(input) {
    return this.parseCurrencyInput(input.value)
  },

  // Mostrar erro
  showError(message) {
    const existingError = document.querySelector('.error')
    if (existingError) {
      existingError.remove()
    }

    const errorDiv = document.createElement('div')
    errorDiv.className = 'error'
    errorDiv.textContent = message

    elements.form.insertAdjacentElement('beforebegin', errorDiv)

    setTimeout(() => {
      errorDiv.remove()
    }, 5000)
  },
}

// Calculadora financeira
const FinancialCalculator = {
  // Converter taxa anual para mensal (taxa composta)
  annualToMonthlyRate(annualRate) {
    return Math.pow(1 + annualRate / 100, 1 / 12) - 1
  },

  // Calcular rendimento com juros compostos
  calculateCompoundInterest(principal, monthlyRate, months) {
    return principal * Math.pow(1 + monthlyRate, months)
  },

  // Calcular custo total do pagamento à vista considerando rendimento Selic
  calculateCashCost(cashValue, productValue, selicRate, installments) {
    const monthlyRate = this.annualToMonthlyRate(selicRate)

    return {
      cashPayment: cashValue,
      effectiveCost: cashValue, // Custo à vista é simplesmente o valor pago
      monthlyRate: monthlyRate,
    }
  },

  // Calcular custo do parcelamento considerando oportunidade de investimento
  calculateInstallmentCost(productValue, cashValue, selicRate, installments) {
    const installmentValue = productValue / installments
    const monthlyRate = this.annualToMonthlyRate(selicRate)

    // Valor que seria investido na Selic (diferença entre total parcelado e à vista)
    const investmentAmount = cashValue

    // Calcular o valor presente das parcelas descontado pela Selic
    // Cada parcela é paga em um mês diferente, então temos que descontar cada uma
    let presentValueOfInstallments = 0
    for (let month = 1; month <= installments; month++) {
      const discountFactor = Math.pow(1 + monthlyRate, month)
      presentValueOfInstallments += installmentValue / discountFactor
    }

    // Calcular quanto o valor à vista renderia se investido na Selic
    // Considerando que seria investido por um período médio de metade das parcelas
    const averagePeriod = installments / 2
    const selicReturn = this.calculateCompoundInterest(
      investmentAmount,
      monthlyRate,
      averagePeriod
    )

    // O custo efetivo do parcelamento é o valor presente das parcelas
    // menos o rendimento que teria com o investimento
    const effectiveCost = presentValueOfInstallments
    const opportunityCost = selicReturn - investmentAmount // rendimento líquido perdido

    return {
      installmentValue: installmentValue,
      totalCost: productValue,
      effectiveCost: effectiveCost,
      selicReturn: selicReturn,
      opportunityCost: opportunityCost,
      presentValueOfInstallments: presentValueOfInstallments,
    }
  },

  // Comparar opções e gerar recomendação
  compareOptions(cashResult, installmentResult, productValue, installments) {
    const cashCost = cashResult.effectiveCost
    const installmentCost = installmentResult.effectiveCost

    const difference = Math.abs(cashCost - installmentCost)
    const percentDifference =
      (difference / Math.min(cashCost, installmentCost)) * 100

    const isCashBetter = cashCost < installmentCost

    return {
      isCashBetter: isCashBetter,
      savings: difference,
      savingsPercent: percentDifference,
      recommendation: this.generateRecommendation(
        isCashBetter,
        difference,
        percentDifference,
        installments
      ),
    }
  },

  // Gerar texto de recomendação
  generateRecommendation(isCashBetter, savings, savingsPercent, installments) {
    if (isCashBetter) {
      if (savingsPercent > 10) {
        return `Comprar à vista é muito mais vantajoso! Você economizará ${Utils.formatCurrency(
          savings
        )} investindo a diferença na Selic durante ${installments} meses.`
      } else if (savingsPercent > 5) {
        return `Comprar à vista é mais vantajoso. A economia de ${Utils.formatCurrency(
          savings
        )} compensa o investimento na Selic.`
      } else {
        return `Comprar à vista é ligeiramente melhor, mas a diferença é pequena (${Utils.formatCurrency(
          savings
        )}). Considere sua disponibilidade de caixa.`
      }
    } else {
      if (savingsPercent > 10) {
        return `Parcelar é muito mais vantajoso! Você terá ${Utils.formatCurrency(
          savings
        )} a mais investindo na Selic ao invés de pagar à vista.`
      } else if (savingsPercent > 5) {
        return `Parcelar é mais vantajoso. Você ganha ${Utils.formatCurrency(
          savings
        )} a mais mantendo o dinheiro investido.`
      } else {
        return `Parcelar é ligeiramente melhor, mas a diferença é pequena (${Utils.formatCurrency(
          savings
        )}). Avalie sua preferência pessoal.`
      }
    }
  },
}

// Gerenciamento da API Selic
const SelicAPI = {
  // Verificar se o cache é válido
  isCacheValid() {
    if (!selicCache.timestamp) return false
    return Date.now() - selicCache.timestamp < CONFIG.CACHE_DURATION
  },

  // Buscar taxa Selic do cache ou API
  async getSelicRate() {
    if (this.isCacheValid()) {
      return {
        rate: selicCache.rate,
        date: selicCache.date,
      }
    }

    try {
      const response = await fetch(CONFIG.API_SELIC_URL)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Dados inválidos recebidos da API')
      }

      const latestData = data[0]
      const rate = parseFloat(latestData.valor)
      const date = latestData.data

      if (isNaN(rate)) {
        throw new Error('Taxa Selic inválida recebida da API')
      }

      console.log(`Taxa Selic carregada: ${rate}% (${date})`)

      // Atualizar cache
      selicCache = {
        rate: rate,
        date: date,
        timestamp: Date.now(),
      }

      return { rate, date }
    } catch (error) {
      console.warn('Erro ao buscar taxa Selic:', error.message)

      // Usar taxa de fallback com data atual formatada corretamente
      const today = new Date()
      const fallbackDate = `${today.getDate().toString().padStart(2, '0')}/${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}/${today.getFullYear()}`

      selicCache = {
        rate: CONFIG.FALLBACK_SELIC_RATE,
        date: fallbackDate,
        timestamp: Date.now(),
      }

      return {
        rate: CONFIG.FALLBACK_SELIC_RATE,
        date: fallbackDate,
      }
    }
  },

  // Atualizar display da taxa Selic
  async updateSelicDisplay() {
    try {
      elements.selicRate.textContent = 'Carregando...'
      elements.selicDate.textContent = ''

      const { rate, date } = await this.getSelicRate()

      elements.selicRate.textContent = `${rate.toFixed(2)}% a.a.`
    } catch (error) {
      console.error('Erro ao atualizar display da Selic:', error)
      elements.selicRate.textContent = `${CONFIG.FALLBACK_SELIC_RATE.toFixed(
        2
      )}% a.a.`
      elements.selicDate.textContent = 'Taxa de referência'
    }
  },
}

// Controlador principal da simulação
const SimulationController = {
  // Inicializar aplicação
  async init() {
    await SelicAPI.updateSelicDisplay()
    this.bindEvents()
    this.setupFormValidation()
  },

  // Configurar eventos
  bindEvents() {
    elements.form.addEventListener('submit', this.handleFormSubmit.bind(this))

    // Auto-preencher valor à vista quando valor do produto for alterado
    elements.productValue.addEventListener(
      'input',
      this.handleProductValueChange.bind(this)
    )

    // Validação em tempo real
    ;[elements.productValue, elements.cashValue, elements.installments].forEach(
      (input) => {
        input.addEventListener('input', this.validateInput.bind(this))
      }
    )
  },

  // Configurar validação do formulário
  setupFormValidation() {
    // Aplicar máscara monetária nos campos de valor
    ;[elements.productValue, elements.cashValue].forEach((input) => {
      // Formatar valor inicial se houver
      if (input.value) {
        Utils.applyCurrencyMask(input)
      }

      // Aplicar máscara durante digitação
      input.addEventListener('input', (e) => {
        Utils.applyCurrencyMask(e.target)
      })

      // Remover formatação ao focar para facilitar edição
      input.addEventListener('focus', (e) => {
        const numericValue = Utils.getNumericValue(e.target)
        if (numericValue > 0) {
          e.target.value = numericValue.toFixed(2).replace('.', ',')
        }
      })

      // Reaplicar formatação ao sair do foco
      input.addEventListener('blur', (e) => {
        const numericValue = Utils.parseCurrencyInput(e.target.value)
        if (numericValue > 0) {
          e.target.value = Utils.formatCurrencyInput(numericValue)
        }
      })
    })

    // Limitar parcelas
    elements.installments.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '') // Apenas números
      value = parseInt(value) || ''

      if (value > 60) value = 60
      if (value < 0) value = ''

      e.target.value = value
    })
  },

  // Tratar mudança no valor do produto
  handleProductValueChange(e) {
    const productValue = Utils.getNumericValue(e.target)
    if (
      Utils.isValidPositiveNumber(productValue) &&
      !elements.cashValue.value
    ) {
      // Sugerir 5% de desconto à vista
      const suggestedCashValue = productValue * 0.95
      elements.cashValue.value = Utils.formatCurrencyInput(suggestedCashValue)
    }
  },

  // Validar input individual
  validateInput(e) {
    const input = e.target
    const value = Utils.getNumericValue(input)

    // Remover classes de erro anteriores
    input.classList.remove('error')

    if (input.value && !Utils.isValidPositiveNumber(value)) {
      input.classList.add('error')
    }

    // Validação específica para valor à vista
    if (input === elements.cashValue) {
      const productValue = Utils.getNumericValue(elements.productValue)
      if (Utils.isValidPositiveNumber(productValue) && value > productValue) {
        input.classList.add('error')
      }
    }
  },

  // Tratar envio do formulário
  async handleFormSubmit(e) {
    e.preventDefault()

    if (!this.validateForm()) {
      return
    }

    await this.performSimulation()
  },

  // Validar formulário completo
  validateForm() {
    const productValue = Utils.getNumericValue(elements.productValue)
    const cashValue = Utils.getNumericValue(elements.cashValue)
    const installments = parseInt(elements.installments.value)

    // Validações básicas
    if (!Utils.isValidPositiveNumber(productValue)) {
      Utils.showError('Por favor, insira um valor válido para o produto.')
      return false
    }

    if (!Utils.isValidPositiveNumber(cashValue)) {
      Utils.showError(
        'Por favor, insira um valor válido para pagamento à vista.'
      )
      return false
    }

    if (!installments || installments < 1 || installments > 60) {
      Utils.showError('Por favor, insira um número válido de parcelas (1-60).')
      return false
    }

    // Validar se valor à vista não é maior que o produto
    if (cashValue > productValue) {
      Utils.showError(
        'O valor à vista não pode ser maior que o valor do produto.'
      )
      return false
    }

    // Validar se há diferença suficiente para investimento
    if (cashValue === productValue) {
      Utils.showError(
        'Para a simulação funcionar, o valor à vista deve ser menor que o valor parcelado.'
      )
      return false
    }

    return true
  },

  // Realizar simulação
  async performSimulation() {
    try {
      // Mostrar loading
      elements.form.classList.add('loading')

      // Obter valores do formulário
      const productValue = Utils.getNumericValue(elements.productValue)
      const cashValue = Utils.getNumericValue(elements.cashValue)
      const installments = parseInt(elements.installments.value)

      // Obter taxa Selic atual
      const { rate: selicRate } = await SelicAPI.getSelicRate()

      // Calcular cenários
      const cashResult = FinancialCalculator.calculateCashCost(
        cashValue,
        productValue,
        selicRate,
        installments
      )

      const installmentResult = FinancialCalculator.calculateInstallmentCost(
        productValue,
        cashValue,
        selicRate,
        installments
      )

      // Comparar opções
      const comparison = FinancialCalculator.compareOptions(
        cashResult,
        installmentResult,
        productValue,
        installments
      )

      // Exibir resultados
      this.displayResults(
        cashResult,
        installmentResult,
        comparison,
        selicRate,
        installments
      )
    } catch (error) {
      Utils.showError('Erro ao realizar simulação. Tente novamente.')
      console.error('Erro na simulação:', error)
    } finally {
      elements.form.classList.remove('loading')
    }
  },

  // Exibir resultados da simulação
  displayResults(
    cashResult,
    installmentResult,
    comparison,
    selicRate,
    installments
  ) {
    // Preencher valores do pagamento à vista
    elements.cashPayment.textContent = Utils.formatCurrency(
      cashResult.cashPayment
    )
    elements.cashTotalCost.textContent = Utils.formatCurrency(
      cashResult.effectiveCost
    )

    // Preencher valores do parcelamento
    elements.installmentValue.textContent = Utils.formatCurrency(
      installmentResult.installmentValue
    )
    elements.installmentTotal.textContent = Utils.formatCurrency(
      installmentResult.totalCost
    )
    elements.installmentTotalCost.textContent = Utils.formatCurrency(
      installmentResult.effectiveCost
    )

    // Preencher recomendação
    elements.recommendationTitle.textContent = comparison.isCashBetter
      ? '🏆 Melhor: Pagamento à Vista'
      : '🏆 Melhor: Pagamento Parcelado'

    elements.recommendationText.textContent = comparison.recommendation

    // Preencher economia/diferença
    elements.savingsLabel.textContent = comparison.isCashBetter
      ? 'Economia total:'
      : 'Vantagem do parcelamento:'
    elements.savingsValue.textContent = Utils.formatCurrency(comparison.savings)
    elements.savingsPercent.textContent = `(${Utils.formatPercent(
      comparison.savingsPercent
    )})`

    // Preencher detalhes
    elements.monthlySelicRate.textContent = Utils.formatPercent(
      cashResult.monthlyRate * 100,
      4
    )
    elements.investmentPeriod.textContent = `${installments} meses`
    elements.grossReturn.textContent = 'Desconto das parcelas pela taxa Selic'

    // Aplicar classes CSS para estilo
    const recommendationCard = document.querySelector('.recommendation-card')
    recommendationCard.className =
      'recommendation-card ' +
      (comparison.isCashBetter ? 'better-cash' : 'better-installment')

    // Mostrar resultados
    elements.results.style.display = 'block'
    elements.results.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
}

// Event listeners para quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  SimulationController.init()
})

// Atualizar taxa Selic periodicamente (a cada 30 minutos)
setInterval(() => {
  SelicAPI.updateSelicDisplay()
}, 30 * 60 * 1000)

// Exportar para uso global (se necessário)
window.SimulacaoFinanceira = {
  FinancialCalculator,
  SelicAPI,
  Utils,
}
