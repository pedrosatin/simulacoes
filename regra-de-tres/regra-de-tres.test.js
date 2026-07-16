/**
 * @jest-environment jsdom
 */
const RegraDeTresCalculadora = require('./regra-de-tres.js')

describe('RegraDeTresCalculadora', () => {
  let calculadora

  beforeEach(() => {
    // Setup initial DOM
    document.body.innerHTML = `
      <!-- Tabs -->
      <button class="tab-button active" data-tab="tab1"></button>
      <button class="tab-button" data-tab="tab2"></button>
      <div class="tab-content active" id="tab1"></div>
      <div class="tab-content" id="tab2"></div>

      <!-- Regra de Três -->
      <input type="text" id="valorA" class="input-number">
      <input type="text" id="valorB" class="input-number">
      <input type="text" id="valorC" class="input-number">
      <input type="text" id="valorX" class="input-number">

      <!-- Porcentagem 1 -->
      <input type="text" id="percentual1" class="input-number">
      <input type="text" id="valor1" class="input-number">
      <span id="resultado1"></span>

      <!-- Aumento / Desconto -->
      <input type="text" id="valorBase" class="input-number">
      <input type="text" id="percentualMudanca" class="input-number">
      <button class="toggle-btn active" data-type="aumento"></button>
      <button class="toggle-btn" data-type="desconto"></button>
      <span id="valorOriginal"></span>
      <span id="tipoMudanca"></span>
      <span id="valorMudanca"></span>
      <span id="valorFinal"></span>

      <!-- Que % é de -->
      <input type="text" id="valorParte" class="input-number">
      <input type="text" id="valorTotal" class="input-number">
      <span id="resultadoPorcentagem"></span>
      <span id="explicacaoCalculo"></span>
    `

    // Initialize calculator
    calculadora = new RegraDeTresCalculadora()
  })

  describe('Initialization', () => {
    it('caches elements correctly', () => {
      expect(calculadora.elements.valorA).toBe(document.getElementById('valorA'))
      expect(calculadora.elements.valorB).toBe(document.getElementById('valorB'))
      expect(calculadora.elements.valorC).toBe(document.getElementById('valorC'))
      expect(calculadora.elements.valorX).toBe(document.getElementById('valorX'))
    })
  })

  describe('Utils', () => {
    it('isValidNumber checks valid numbers', () => {
      expect(calculadora.isValidNumber('')).toBe(true)
      expect(calculadora.isValidNumber('123')).toBe(true)
      expect(calculadora.isValidNumber('123,45')).toBe(true)
      expect(calculadora.isValidNumber('123.45')).toBe(false)
      expect(calculadora.isValidNumber('123,456')).toBe(false)
      expect(calculadora.isValidNumber('abc')).toBe(false)
    })

    it('parseNumber converts string to number', () => {
      expect(calculadora.parseNumber('')).toBe(0)
      expect(calculadora.parseNumber('123')).toBe(123)
      expect(calculadora.parseNumber('123,45')).toBe(123.45)
    })

    it('formatNumber converts number to simple formatted string', () => {
      expect(calculadora.formatNumber(1234.56)).toBe('1.234,56')
      expect(calculadora.formatNumber(1234.5, 1)).toBe('1.234,5')
    })
  })

  describe('Input Masks', () => {
    it('formatarNumero formats input on typing', () => {
      const input = document.getElementById('valorA')

      // Simular digitação
      input.value = '123a,456'
      calculadora.formatarNumero({ target: input })
      expect(input.value).toBe('123,45')

      input.value = '1,2,3'
      calculadora.formatarNumero({ target: input })
      expect(input.value).toBe('1,23')
    })

    it('validarNumero validates input on blur', () => {
      const input = document.getElementById('valorA')

      input.value = '123,45'
      calculadora.validarNumero({ target: input })
      expect(input.style.borderColor).toBe('')

      input.value = '123,456' // invalid format according to regex
      calculadora.validarNumero({ target: input })
      expect(input.style.borderColor).toBe('rgb(255, 71, 87)') // #ff4757 em rgb
    })
  })

  describe('Regra de Três Simples', () => {
    it('calculates X correctly (A/B = C/X)', () => {
      document.getElementById('valorA').value = '10'
      document.getElementById('valorB').value = '20'
      document.getElementById('valorC').value = '5'

      calculadora.calcularRegraDeTres()

      expect(document.getElementById('valorX').value).toBe('10,00')
    })

    it('clears X if A is 0 or empty', () => {
      document.getElementById('valorA').value = '0'
      document.getElementById('valorB').value = '20'
      document.getElementById('valorC').value = '5'
      document.getElementById('valorX').value = '10,00'

      calculadora.calcularRegraDeTres()

      expect(document.getElementById('valorX').value).toBe('')
    })
  })

  describe('Porcentagem 1 (X% de um valor)', () => {
    it('calculates percentage correctly', () => {
      document.getElementById('percentual1').value = '15'
      document.getElementById('valor1').value = '200'

      calculadora.calcularPorcentagem1()

      expect(document.getElementById('resultado1').textContent).toBe('30,00')
    })
  })

  describe('Aumento e Desconto', () => {
    it('calculates aumento correctly', () => {
      document.getElementById('valorBase').value = '100'
      document.getElementById('percentualMudanca').value = '10'

      calculadora.calcularAumentoDesconto()

      expect(document.getElementById('valorOriginal').textContent).toBe('100,00')
      expect(document.getElementById('tipoMudanca').textContent).toBe('Aumento:')
      expect(document.getElementById('valorMudanca').textContent).toBe('10,00')
      expect(document.getElementById('valorFinal').textContent).toBe('110,00')
      expect(document.getElementById('valorFinal').style.color).toBe('rgb(46, 213, 115)') // #2ed573
    })

    it('calculates desconto correctly', () => {
      // Toggle to desconto
      const descontoBtn = document.querySelector('button[data-type="desconto"]')
      calculadora.toggleAumentoDesconto({ target: descontoBtn })

      document.getElementById('valorBase').value = '100'
      document.getElementById('percentualMudanca').value = '10'

      calculadora.calcularAumentoDesconto()

      expect(document.getElementById('tipoMudanca').textContent).toBe('Desconto:')
      expect(document.getElementById('valorMudanca').textContent).toBe('10,00')
      expect(document.getElementById('valorFinal').textContent).toBe('90,00')
      expect(document.getElementById('valorFinal').style.color).toBe('rgb(255, 71, 87)') // #ff4757
    })
  })

  describe('Proporção Porcentual', () => {
    it('calculates proportion correctly', () => {
      document.getElementById('valorParte').value = '25'
      document.getElementById('valorTotal').value = '200'

      calculadora.calcularProporcaoPorcentual()

      expect(document.getElementById('resultadoPorcentagem').textContent).toBe('12,5%')
      expect(document.getElementById('explicacaoCalculo').textContent).toBe('25,00 representa 12,5% de 200,00')
    })

    it('handles total 0', () => {
      document.getElementById('valorParte').value = '25'
      document.getElementById('valorTotal').value = '0'

      calculadora.calcularProporcaoPorcentual()

      expect(document.getElementById('resultadoPorcentagem').textContent).toBe('0%')
      expect(document.getElementById('explicacaoCalculo').textContent).toBe('Informe o valor total')
    })
  })
})
