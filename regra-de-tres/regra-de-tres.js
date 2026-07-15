/**
 * Calculadora de Regra de Três e Porcentagens
 * Autor: satinP
 * Data: 2025
 */

class RegraDeTresCalculadora {
  constructor() {
    this.init();
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.setupTabs();
    this.setupInputMasks();
  }

  /**
   * Cache elements to avoid repeated DOM queries
   */
  cacheElements() {
    this.elements = {
      valorA: document.getElementById("valorA"),
      valorB: document.getElementById("valorB"),
      valorC: document.getElementById("valorC"),
      valorX: document.getElementById("valorX"),

      percentual1: document.getElementById("percentual1"),
      valor1: document.getElementById("valor1"),
      resultado1: document.getElementById("resultado1"),

      valorBase: document.getElementById("valorBase"),
      percentualMudanca: document.getElementById("percentualMudanca"),
      valorOriginal: document.getElementById("valorOriginal"),
      tipoMudanca: document.getElementById("tipoMudanca"),
      valorMudanca: document.getElementById("valorMudanca"),
      valorFinal: document.getElementById("valorFinal"),

      valorParte: document.getElementById("valorParte"),
      valorTotal: document.getElementById("valorTotal"),
      resultadoPorcentagem: document.getElementById("resultadoPorcentagem"),
      explicacaoCalculo: document.getElementById("explicacaoCalculo"),
    };
  }

  /**
   * Configurar listeners para todos os eventos
   */
  setupEventListeners() {
    // Regra de três
    const inputsRegraTres = ["valorA", "valorB", "valorC"];
    inputsRegraTres.forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () => this.calcularRegraDeTres());
      }
    });

    // Porcentagem - Quanto é X% de um valor
    ["percentual1", "valor1"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () => this.calcularPorcentagem1());
      }
    });

    // Porcentagem - Aumento/Desconto
    ["valorBase", "percentualMudanca"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () => this.calcularAumentoDesconto());
      }
    });

    // Toggle aumento/desconto
    const toggleButtons = document.querySelectorAll(".toggle-btn");
    toggleButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => this.toggleAumentoDesconto(e));
    });

    // Que % é de
    ["valorParte", "valorTotal"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", () =>
          this.calcularProporcaoPorcentual(),
        );
      }
    });
  }

  /**
   * Configurar sistema de abas
   */
  setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetTab = button.getAttribute("data-tab");

        // Remover classe active de todos os botões e conteúdos
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        // Adicionar classe active ao botão clicado e conteúdo correspondente
        button.classList.add("active");
        document.getElementById(targetTab).classList.add("active");
      });
    });
  }

  /**
   * Configurar máscaras de input
   */
  setupInputMasks() {
    const inputsNumber = document.querySelectorAll(".input-number");
    inputsNumber.forEach((input) => {
      input.addEventListener("input", (e) => this.formatarNumero(e));
      input.addEventListener("blur", (e) => this.validarNumero(e));
    });
  }

  /**
   * Formatar número conforme digitação
   */
  formatarNumero(event) {
    const input = event.target;
    let value = input.value;

    // Remover caracteres não numéricos exceto vírgula
    value = value.replace(/[^0-9,]/g, "");

    // Permitir apenas uma vírgula
    const partes = value.split(",");
    if (partes.length > 2) {
      value = partes[0] + "," + partes.slice(1).join("");
    }

    // Limitar casas decimais a 2
    if (partes.length === 2 && partes[1].length > 2) {
      value = partes[0] + "," + partes[1].substring(0, 2);
    }

    input.value = value;
  }

  /**
   * Validar número ao sair do campo
   */
  validarNumero(event) {
    const input = event.target;
    const value = input.value;

    if (value && !this.isValidNumber(value)) {
      input.style.borderColor = "#ff4757";
      input.style.boxShadow = "0 0 10px rgba(255, 71, 87, 0.3)";
    } else {
      input.style.borderColor = "";
      input.style.boxShadow = "";
    }
  }

  /**
   * Verificar se é um número válido
   */
  isValidNumber(value) {
    if (!value) return true;
    const numberRegex = /^\d+(,\d{1,2})?$/;
    return numberRegex.test(value);
  }

  /**
   * Converter string para número
   */
  parseNumber(value) {
    if (!value) return 0;
    return parseFloat(value.replace(",", ".")) || 0;
  }

  /**
   * Formatar número para exibição simples
   */
  formatNumber(value, decimals = 2) {
    if (!this._numberFormatters) {
      this._numberFormatters = new Map();
    }

    if (!this._numberFormatters.has(decimals)) {
      this._numberFormatters.set(
        decimals,
        new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }),
      );
    }

    return this._numberFormatters.get(decimals).format(value);
  }

  /**
   * Calcular regra de três simples
   * A está para B assim como C está para X
   * A/B = C/X → X = (B * C) / A
   */
  calcularRegraDeTres() {
    const valorA = this.parseNumber(this.elements.valorA?.value);
    const valorB = this.parseNumber(this.elements.valorB?.value);
    const valorC = this.parseNumber(this.elements.valorC?.value);

    const resultadoInput = this.elements.valorX;

    if (valorA === 0 || !valorA) {
      resultadoInput.value = "";
      return;
    }

    // Fórmula: X = (B * C) / A
    const resultado = (valorB * valorC) / valorA;

    // Exibir resultado formatado
    resultadoInput.value = this.formatNumber(resultado);

    // Adicionar animação visual
    this.animateResult(resultadoInput);
  }

  /**
   * Calcular quanto é X% de um valor
   */
  calcularPorcentagem1() {
    const percentual = this.parseNumber(this.elements.percentual1?.value);
    const valor = this.parseNumber(this.elements.valor1?.value);

    const resultado = (percentual / 100) * valor;

    if (this.elements.resultado1) {
      this.elements.resultado1.textContent = this.formatNumber(resultado, 2);
    }
  }

  /**
   * Calcular aumento ou desconto percentual
   */
  calcularAumentoDesconto() {
    const valorBase = this.parseNumber(this.elements.valorBase?.value);
    const percentual = this.parseNumber(this.elements.percentualMudanca?.value);

    const activeToggle = document.querySelector(".toggle-btn.active");
    const isAumento = activeToggle
      ? activeToggle.dataset.type === "aumento"
      : true;

    const valorMudanca = (percentual / 100) * valorBase;
    const valorFinal = isAumento
      ? valorBase + valorMudanca
      : valorBase - valorMudanca;

    // Atualizar elementos
    if (this.elements.valorOriginal) {
      this.elements.valorOriginal.textContent = this.formatNumber(valorBase, 2);
    }
    if (this.elements.tipoMudanca) {
      this.elements.tipoMudanca.textContent = isAumento
        ? "Aumento:"
        : "Desconto:";
    }
    if (this.elements.valorMudanca) {
      this.elements.valorMudanca.textContent = this.formatNumber(
        valorMudanca,
        2,
      );
    }
    const valorFinalElement = this.elements.valorFinal;
    if (valorFinalElement) {
      valorFinalElement.textContent = this.formatNumber(valorFinal, 2);
      // Colorir valor final baseado no tipo
      valorFinalElement.style.color = isAumento ? "#2ed573" : "#ff4757";
    }
  }

  /**
   * Toggle entre aumento e desconto
   */
  toggleAumentoDesconto(event) {
    const clickedBtn = event.target;
    const allBtns = document.querySelectorAll(".toggle-btn");

    allBtns.forEach((btn) => btn.classList.remove("active"));
    clickedBtn.classList.add("active");

    // Recalcular
    this.calcularAumentoDesconto();
  }

  /**
   * Calcular que porcentagem um valor representa de outro
   */
  calcularProporcaoPorcentual() {
    const valorParte = this.parseNumber(this.elements.valorParte?.value);
    const valorTotal = this.parseNumber(this.elements.valorTotal?.value);

    if (valorTotal === 0) {
      if (this.elements.resultadoPorcentagem) {
        this.elements.resultadoPorcentagem.textContent = "0%";
      }
      if (this.elements.explicacaoCalculo) {
        this.elements.explicacaoCalculo.textContent = "Informe o valor total";
      }
      return;
    }

    const porcentagem = (valorParte / valorTotal) * 100;

    // Atualizar resultado
    if (this.elements.resultadoPorcentagem) {
      this.elements.resultadoPorcentagem.textContent =
        this.formatNumber(porcentagem, 1) + "%";
    }

    // Atualizar explicação
    if (this.elements.explicacaoCalculo) {
      this.elements.explicacaoCalculo.textContent = `${this.formatNumber(
        valorParte,
        2,
      )} representa ${this.formatNumber(porcentagem, 1)}% de ${this.formatNumber(
        valorTotal,
        2,
      )}`;
    }

    // Animar resultado
    if (this.elements.resultadoPorcentagem) {
      this.animateResult(this.elements.resultadoPorcentagem);
    }
  }

  /**
   * Animar resultado quando calculado
   */
  animateResult(element) {
    element.style.transform = "scale(1.05)";
    element.style.transition = "transform 0.2s ease";

    setTimeout(() => {
      element.style.transform = "scale(1)";
    }, 200);
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  new RegraDeTresCalculadora();
});

// Exportar para uso em outros scripts se necessário
if (typeof module !== "undefined" && module.exports) {
  module.exports = RegraDeTresCalculadora;
}
