// Utilitários compartilhados

function applyMoneyMask(input) {
  let value = input.value.replace(/\D/g, '')
  if (value) {
    value = (parseInt(value, 10) / 100).toFixed(2)
    value = value.replace('.', ',')
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    input.value = 'R$ ' + value
  } else {
    input.value = ''
  }
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    applyMoneyMask
  }
} else if (typeof window !== 'undefined') {
  // Expor no escopo global para o navegador
  window.applyMoneyMask = applyMoneyMask;
}
