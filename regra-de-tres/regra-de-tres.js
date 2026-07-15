/**
 * Data: 2025
 */

class RegraDeTresCalculadora {
  constructor() {
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setupTabs()
    this.setupInputMasks()
  }

  setupEventListeners() {
    // Regra de três
    const inputsRegraTres = ['valorA', 'valorB', 'valorC']
    inputsRegraTres.forEach((id) => {
      const input = document.getElementById(id)
      if (input) {
        input.addEventListener('input', () => this.calcularRegraDeTres())
      }
    })

    // Porcentagem - Quanto é X% de um valor
    ;['percentual1', 'valor1'].forEach((id) => {
      const input = document.getElementById(id)
      if (input) {
        input.addEventListener('input', () => this.calcularPorcentagem1())
      }
    })

    // Porcentagem - Aumento/Desconto
    ;['valorBase', 'percentualMudanca'].forEach((id) => {
      const input = document.getElementById(id)
      if (input) {
        input.addEventListener('input', () => this.calcularAumentoDesconto())
      }
    })

    // Toggle aumento/desconto
    const toggleButtons = document.querySelectorAll('.toggle-btn')
    toggleButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => this.toggleAumentoDesconto(e))
    })

    // Que % é de
    ;['valorParte', 'valorTotal'].forEach((id) => {
      const input = document.getElementById(id)
      if (input) {
        input.addEventListener('input', () =>
          this.calcularProporcaoPorcentual()
        )
      }
    })
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button')
    const tabContents = document.querySelectorAll('.tab-content')

    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab')

        // Remover classe active de todos os botões e conteúdos
        tabButtons.forEach((btn) => btn.classList.remove('active'))
        tabContents.forEach((content) => content.classList.remove('active'))

        // Adicionar classe active ao botão clicado e conteúdo correspondente
        button.classList.add('active')
        document.getElementById(targetTab).classList.add('active')
      })
    })
  }

  setupInputMasks() {
    const inputsNumber = document.querySelectorAll('.input-number')
    inputsNumber.forEach((input) => {
      input.addEventListener('input', (e) => this.formatarNumero(e))
      input.addEventListener('blur', (e) => this.validarNumero(e))
    })
  }

  formatarNumero(event) {
    const input = event.target
    let value = input.value

    // Remover caracteres não numéricos exceto vírgula
    value = value.replace(/[^0-9,]/g, '')

    // Permitir apenas uma vírgula
    const partes = value.split(',')
    if (partes.length > 2) {
      value = partes[0] + ',' + partes.slice(1).join('')
    }

    // Limitar casas decimais a 2
    if (partes.length === 2 && partes[1].length > 2) {
      value = partes[0] + ',' + partes[1].substring(0, 2)
    }

    input.value = value
  }

  validarNumero(event) {
    const input = event.target
    const value = input.value

    if (value && !this.isValidNumber(value)) {
      input.style.borderColor = '#ff4757'
      input.style.boxShadow = '0 0 10px rgba(255, 71, 87, 0.3)'
    } else {
      input.style.borderColor = ''
      input.style.boxShadow = ''
    }
  }

  isValidNumber(value) {
    if (!value) return true
    const numberRegex = /^\d+(,\d{1,2})?$/
    return numberRegex.test(value)
  }

  parseNumber(value) {
    if (!value) return 0
    return parseFloat(value.replace(',', '.')) || 0
  }


  formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  /**
   * Calcular regra de três simples
   * A está para B assim como C está para X
   * A/B = C/X → X = (B * C) / A
   */
  calcularRegraDeTres() {
    const valorA = this.parseNumber(document.getElementById('valorA').value)
    const valorB = this.parseNumber(document.getElementById('valorB').value)
    const valorC = this.parseNumber(document.getElementById('valorC').value)

    const resultadoInput = document.getElementById('valorX')

    if (valorA === 0 || !valorA) {
      resultadoInput.value = ''
      return
    }

    // Fórmula: X = (B * C) / A
    const resultado = (valorB * valorC) / valorA

    // Exibir resultado formatado
    resultadoInput.value = this.formatNumber(resultado)

    // Adicionar animação visual
    this.animateResult(resultadoInput)
  }

  calcularPorcentagem1() {
    const percentual = this.parseNumber(
      document.getElementById('percentual1').value
    )
    const valor = this.parseNumber(document.getElementById('valor1').value)

    const resultado = (percentual / 100) * valor

    document.getElementById('resultado1').textContent = this.formatNumber(
      resultado,
      2
    )
  }

  calcularAumentoDesconto() {
    const valorBase = this.parseNumber(
      document.getElementById('valorBase').value
    )
    const percentual = this.parseNumber(
      document.getElementById('percentualMudanca').value
    )

    const isAumento =
      document.querySelector('.toggle-btn.active').dataset.type === 'aumento'

    const valorMudanca = (percentual / 100) * valorBase
    const valorFinal = isAumento
      ? valorBase + valorMudanca
      : valorBase - valorMudanca

    // Atualizar elementos
    document.getElementById('valorOriginal').textContent = this.formatNumber(
      valorBase,
      2
    )
    document.getElementById('tipoMudanca').textContent = isAumento
      ? 'Aumento:'
      : 'Desconto:'
    document.getElementById('valorMudanca').textContent = this.formatNumber(
      valorMudanca,
      2
    )
    document.getElementById('valorFinal').textContent = this.formatNumber(
      valorFinal,
      2
    )

    // Colorir valor final baseado no tipo
    const valorFinalElement = document.getElementById('valorFinal')
    valorFinalElement.style.color = isAumento ? '#2ed573' : '#ff4757'
  }

  toggleAumentoDesconto(event) {
    const clickedBtn = event.target
    const allBtns = document.querySelectorAll('.toggle-btn')

    allBtns.forEach((btn) => btn.classList.remove('active'))
    clickedBtn.classList.add('active')

    // Recalcular
    this.calcularAumentoDesconto()
  }

  calcularProporcaoPorcentual() {
    const valorParte = this.parseNumber(
      document.getElementById('valorParte').value
    )
    const valorTotal = this.parseNumber(
      document.getElementById('valorTotal').value
    )

    if (valorTotal === 0) {
      document.getElementById('resultadoPorcentagem').textContent = '0%'
      document.getElementById('explicacaoCalculo').textContent =
        'Informe o valor total'
      return
    }

    const porcentagem = (valorParte / valorTotal) * 100

    // Atualizar resultado
    document.getElementById('resultadoPorcentagem').textContent =
      this.formatNumber(porcentagem, 1) + '%'

    // Atualizar explicação
    document.getElementById(
      'explicacaoCalculo'
    ).textContent = `${this.formatNumber(
      valorParte,
      2
    )} representa ${this.formatNumber(porcentagem, 1)}% de ${this.formatNumber(
      valorTotal,
      2
    )}`

    // Animar resultado
    this.animateResult(document.getElementById('resultadoPorcentagem'))
  }

  animateResult(element) {
    element.style.transform = 'scale(1.05)'
    element.style.transition = 'transform 0.2s ease'

    setTimeout(() => {
      element.style.transform = 'scale(1)'
    }, 200)
  }

  mostrarPassoAPasso(tipo, valores) {
    // Funcionalidade para mostrar os passos do cálculo
    // Pode ser implementada no futuro para fins educativos
    console.log(`Cálculo do tipo: ${tipo}`, valores)
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  new RegraDeTresCalculadora()
})

// Exportar para uso em outros scripts se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegraDeTresCalculadora
}
