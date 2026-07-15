// js/utils.js

/**
 * Formata número para formato monetário brasileiro (R$ 1.234,56)
 * @param {number} value - O valor numérico a ser formatado
 * @returns {string} O valor formatado em reais
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Aplica máscara monetária brasileira diretamente em um elemento de input
 * @param {HTMLInputElement} input - O elemento de input
 */
function applyMoneyMask(input) {
  let value = input.value.replace(/\D/g, '')
  if (value === '') {
    input.value = ''
    return
  }

  value = (parseInt(value, 10) / 100).toFixed(2)
  value = value.replace('.', ',')
  value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  input.value = 'R$ ' + value
}

/**
 * Converte string monetária (ex: "R$ 1.000,00") para número float (1000.00)
 * @param {string|number} value - O valor a ser convertido
 * @returns {number} O valor numérico
 */
function parseCurrency(value) {
  if (!value) return 0
  if (typeof value === 'number') return value

  // Remove tudo exceto números, vírgula e sinal de menos
  const cleaned = String(value)
    .replace(/[^\d,-]/g, '')
    .replace(',', '.')

  return parseFloat(cleaned) || 0
}

/**
 * Formata um valor (numérico ou string) para o formato de input (R$ 1.234,56)
 * Útil para inicializar valores de input.
 * @param {string|number} value - O valor a ser formatado
 * @returns {string} O valor formatado
 */
function formatCurrencyInput(value) {
  if (value === null || value === undefined || value === '') return ''

  let numericValue = value
  if (typeof value === 'string') {
    let digits = value.replace(/\D/g, '')
    if (digits === '') return ''
    numericValue = (parseInt(digits, 10) || 0) / 100
  }

  return formatCurrency(numericValue)
}
