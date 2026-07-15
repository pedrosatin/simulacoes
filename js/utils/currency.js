// Formatadores de moeda compartilhados
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

const CurrencyUtils = {
  // Formatar valor monetário para exibição (ex: R$ 1.234,56)
  formatCurrency(value) {
    if (!isFinite(value) && value !== undefined && value !== null && typeof value !== 'number') return '—'
    if (!value && value !== 0) return ''
    return currencyFormatter.format(value)
  },

  // Formatar valor para input (mantendo formatação mas com comportamento adaptado se necessário)
  formatCurrencyInput(value) {
    if (!value) return ''
    const numericValue = this.parseCurrency(value.toString())
    if (isNaN(numericValue)) return value
    return currencyInputFormatter.format(numericValue)
  },

  // Converter string monetária/formatada para número
  parseCurrency(value) {
    if (typeof value === 'number') return value
    if (!value || typeof value !== 'string') return 0

    // Remove tudo exceto números, vírgula e ponto (para não quebrar formatações antigas/variadas)
    // Tenta ser robusto para formatos do tipo "R$ 1.234,56"

    // Check if it's already a valid float like 1234.56
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value)
    }

    const cleanedValue = value.replace(/[^\d,.-]/g, '')

    // Conta quantos pontos e vírgulas tem para tentar adivinhar o formato
    const points = (cleanedValue.match(/\./g) || []).length
    const commas = (cleanedValue.match(/,/g) || []).length

    if (commas === 1 && points <= 1) {
       // Formato brasileiro: 1.234,56 -> 1234.56
       return parseFloat(cleanedValue.replace(/\./g, '').replace(',', '.')) || 0
    }

    // Fallback simples
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
  },

  // Aplicar máscara monetária a um input (R$ 1.234,56 enquanto digita)
  applyMoneyMask(input) {
    let value = input.value.replace(/\D/g, '')
    if (value) {
      value = (parseInt(value) / 100).toFixed(2)
      value = value.replace('.', ',')
      value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      input.value = 'R$ ' + value
    } else {
      input.value = ''
    }
  }
}

// Exportar para ambiente Node.js (testes) ou Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CurrencyUtils
}
if (typeof window !== 'undefined') {
  window.CurrencyUtils = CurrencyUtils
}
