// Formatadores de moeda compartilhados
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const currencyInputFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const SharedUtils = {
  // Formatar valor monetário para exibição (R$ 1.234,56)
  formatCurrency(value) {
    if (value === null || value === undefined || (typeof value === 'number' && !isFinite(value)) || (typeof value === 'string' && isNaN(Number(value)))) return '—';
    return currencyFormatter.format(value);
  },

  // Formatar valor para input preservando duas casas decimais
  formatCurrencyInput(value) {
    if (value === null || value === undefined || (typeof value === 'number' && !isFinite(value)) || (typeof value === 'string' && isNaN(Number(value)))) return '—';
    return currencyInputFormatter.format(value);
  },

  // Converter string monetária formatada para número (float)
  parseCurrency(value) {
    if (!value) return 0;
    if (typeof value !== 'string') return Number(value) || 0;

    // Remove símbolos monetários e espaços
    let cleaned = value.replace(/[R$\s]/g, '');

    // Substitui vírgula decimal por ponto e remove separadores de milhar
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');

    return parseFloat(cleaned) || 0;
  }
};

// Exportar para uso global no browser
if (typeof window !== 'undefined') {
  window.SharedUtils = SharedUtils;
}

// Exportar para testes no Node (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedUtils;
}
