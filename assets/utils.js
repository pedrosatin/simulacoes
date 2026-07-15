// Formatadores de moeda (cache para otimização de performance)
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const currencyInputFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Utilitários Compartilhados
const Utils = {
  // Formatar valor monetário
  formatCurrency(value) {
    if (!isFinite(value)) return '—'
    return currencyFormatter.format(value)
  },

  // Formatar valor para input (R$ 1.234,56)
  formatCurrencyInput(value) {
    if (value === null || value === undefined || value === '') return ''

    const numericValue = this.parseCurrencyInput(value)
    if (isNaN(numericValue)) return value

    return currencyInputFormatter.format(numericValue)
  },

  // Converter valor formatado para número
  parseCurrencyInput(value) {
    if (typeof value !== 'string') return value || 0

    // Remove símbolos monetários e espaços
    let cleaned = value.replace(/[R$\s]/g, '')

    // Substitui vírgula decimal por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')

    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  },

  // Aplicar máscara monetária em tempo real
  applyCurrencyMask(input) {
    let value = input.value

    // Remove tudo exceto números
    value = value.replace(/\D/g, '')

    if (!value) {
      input.value = ''
      return 0
    }

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

  // Mostrar erro (precisa de um form para ser inserido antes dele, se não passar form ele tenta pegar form com id simulationForm)
  showError(message, formElement) {
    const existingError = document.querySelector('.error')
    if (existingError) {
      existingError.remove()
    }

    const errorDiv = document.createElement('div')
    errorDiv.className = 'error'
    errorDiv.textContent = message

    const form = formElement || document.getElementById('simulationForm') || document.querySelector('form')

    if (form) {
      form.insertAdjacentElement('beforebegin', errorDiv)
    } else {
      document.body.prepend(errorDiv)
    }

    setTimeout(() => {
      errorDiv.remove()
    }, 5000)
  },
}

// Exportar para uso global (se necessário)
if (typeof window !== 'undefined') {
  window.Utils = Utils
}

// Exportar para testes no Node (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Utils
  }
}
