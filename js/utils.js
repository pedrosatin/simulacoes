function applyMoneyMask(input) {
  const digits = input.value.replace(/\D/g, '')

  if (!digits) {
    input.value = ''
    return
  }

  let numStr = parseInt(digits, 10).toString()
  if (numStr.length < 3) {
    numStr = numStr.padStart(3, '0')
  }

  const reais = numStr.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const cents = numStr.slice(-2)

  input.value = `R$ ${reais},${cents}`
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyMoneyMask }
}

if (typeof window !== 'undefined') {
  window.applyMoneyMask = applyMoneyMask
}
