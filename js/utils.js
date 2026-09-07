// Utilitários compartilhados de moeda e número.
// Fonte única para as 5 calculadoras: exibição, parse e máscara de input.

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Cache de formatadores por número de casas decimais: criar um
// Intl.NumberFormat é caro e essas funções rodam a cada tecla digitada.
const numberFormatters = new Map()

function getNumberFormatter(decimals) {
  if (!numberFormatters.has(decimals)) {
    numberFormatters.set(
      decimals,
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    )
  }
  return numberFormatters.get(decimals)
}

/**
 * Formata um valor como moeda brasileira: 1234.5 -> "R$ 1.234,50".
 * O separador entre o símbolo e o número é o espaço não-quebrável do Intl.
 */
function formatCurrency(value) {
  if (!isFinite(value)) return '—'
  return currencyFormatter.format(value)
}

/** Formata um número com separador de milhar: 1234.5 -> "1.234,50". */
function formatNumber(value, decimals = 2) {
  if (!isFinite(value)) return '—'
  return getNumberFormatter(decimals).format(value)
}

/**
 * Converte uma string no formato pt-BR em número.
 * Aceita "R$ 1.234,56", "1.234,56" e "1234,56"; o ponto é sempre tratado
 * como separador de milhar e a vírgula como separador decimal.
 * Números passam direto; qualquer coisa não convertível vira 0.
 */
function parseLocaleNumber(value) {
  if (typeof value === 'number') return isFinite(value) ? value : 0
  if (!value) return 0

  // A ordem importa: descartamos ruído (símbolo, espaços) antes de mexer nos
  // separadores, e só a primeira vírgula vira ponto decimal — o parseFloat
  // para na segunda, descartando o resto de uma entrada malformada.
  const cleaned = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Máscara monetária em tempo real: os dígitos digitados são lidos como
 * centavos, então "12345" vira "R$ 123,45". Muta `input.value` e devolve
 * o valor numérico correspondente.
 */
function applyMoneyMask(input) {
  const digits = input.value.replace(/\D/g, '')

  if (!digits) {
    input.value = ''
    return 0
  }

  const value = parseInt(digits, 10) / 100
  input.value = formatCurrency(value)
  return value
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatCurrency,
    formatNumber,
    parseLocaleNumber,
    applyMoneyMask,
  }
}

if (typeof window !== 'undefined') {
  window.formatCurrency = formatCurrency
  window.formatNumber = formatNumber
  window.parseLocaleNumber = parseLocaleNumber
  window.applyMoneyMask = applyMoneyMask
}
