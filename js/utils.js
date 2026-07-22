function applyMoneyMask(input) {
  let valueString = input.value
  let digits = ''
  for (let i = 0; i < valueString.length; i++) {
    if (valueString[i] >= '0' && valueString[i] <= '9') {
      digits += valueString[i]
    }
  }

  if (!digits) {
    input.value = ''
    return
  }

  let numStr = parseInt(digits, 10).toString()
  if (numStr.length < 3) {
    numStr = numStr.padStart(3, '0')
  }

  const reais = numStr.slice(0, -2)
  const cents = numStr.slice(-2)

  let formattedReais = ''
  for (let i = reais.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedReais = '.' + formattedReais
    }
    formattedReais = reais[i] + formattedReais
  }

  input.value = 'R$ ' + formattedReais + ',' + cents
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyMoneyMask }
}

if (typeof window !== 'undefined') {
  window.applyMoneyMask = applyMoneyMask
}
