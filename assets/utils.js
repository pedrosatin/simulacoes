const Utils = {
  // Aplicar máscara monetária
  applyMoneyMask(input) {
    let value = input.value.replace(/\D/g, "");
    if (value) {
      value = (parseInt(value) / 100).toFixed(2);
      value = value.replace(".", ",");
      value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      input.value = "R$ " + value;
    } else {
      input.value = "";
    }
  },

  // Converter string monetária para número
  parseCurrency(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  },
};

if (typeof window !== "undefined") {
  window.SimulacaoFinanceiraUtils = Utils;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Utils;
}
