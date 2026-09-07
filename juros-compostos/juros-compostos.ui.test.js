/**
 * @jest-environment jsdom
 *
 * Testes de comportamento da camada de UI (JurosCompostosCalculadora).
 * O motor puro (JurosMath/Format) é coberto em juros-compostos.test.js.
 */
const {
  JurosMath,
  Format,
  JurosCompostosCalculadora,
} = require('./juros-compostos.js')

// Só os ids que a classe realmente lê/escreve, agrupados por aba.
const MARKUP = `
  <button class="tab-button" data-tab="tabJuros"></button>
  <button class="tab-button" data-tab="tabRenda"></button>
  <div class="tab-content" id="tabJuros"></div>
  <div class="tab-content" id="tabRenda"></div>

  <input data-money id="jurosAporteInicial">
  <input id="jurosAporteMensal">
  <input id="jurosTaxa">
  <select id="jurosTaxaPeriodo"><option value="anual">anual</option><option value="mensal">mensal</option></select>
  <input id="jurosTempo">
  <select id="jurosTempoPeriodo"><option value="anos">anos</option><option value="meses">meses</option></select>
  <button id="calcJurosBtn"></button>
  <div id="jurosResultado"></div>
  <span id="jurosMontante"></span>
  <span id="jurosInvestido"></span>
  <span id="jurosJuros"></span>
  <span id="jurosTaxaMensalInfo"></span>
  <table><tbody id="jurosEvolucaoBody"></tbody></table>

  <input id="rendaDesejada">
  <input id="rendaTaxa">
  <select id="rendaTaxaPeriodo"><option value="anual">anual</option><option value="mensal">mensal</option></select>
  <input id="rendaAporteInicial">
  <input id="rendaAporteMensal">
  <button id="calcRendaBtn"></button>
  <div id="rendaResultado"></div>
  <span id="rendaPatrimonio"></span>
  <span id="rendaExplicacao"></span>
  <span id="rendaTempo"></span>

  <input id="compararAporteInicial">
  <input id="compararAporteMensal">
  <input id="compararTempo">
  <select id="compararTempoPeriodo"><option value="anos">anos</option><option value="meses">meses</option></select>
  <input id="compararTaxaA">
  <select id="compararTaxaAPeriodo"><option value="mensal">mensal</option><option value="anual">anual</option></select>
  <input id="compararTaxaB">
  <select id="compararTaxaBPeriodo"><option value="mensal">mensal</option><option value="anual">anual</option></select>
  <button id="calcCompararBtn"></button>
  <div id="compararResultado"></div>
  <span id="compararMontanteA"></span>
  <span id="compararMontanteB"></span>
  <span id="compararVeredito"></span>
  <div id="compararCardA"></div>
  <div id="compararCardB"></div>

  <input id="aposIdadeAtual">
  <input id="aposIdadeAposentar">
  <input id="aposAporteInicial">
  <input id="aposAporteMensal">
  <input id="aposTaxa">
  <select id="aposTaxaPeriodo"><option value="mensal">mensal</option><option value="anual">anual</option></select>
  <input id="aposRendaDesejada">
  <button id="calcAposentadoriaBtn"></button>
  <div id="aposResultado"></div>
  <span id="aposPatrimonio"></span>
  <span id="aposRendaGerada"></span>
  <span id="aposResumo"></span>
  <span id="aposMeta"></span>
`

const set = (id, value) => {
  document.getElementById(id).value = value
}
const text = (id) => document.getElementById(id).textContent
const click = (id) => document.getElementById(id).click()

describe('JurosCompostosCalculadora', () => {
  let calculadora
  let alertSpy

  beforeEach(() => {
    document.body.innerHTML = MARKUP
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    calculadora = new JurosCompostosCalculadora()
  })

  afterEach(() => {
    alertSpy.mockRestore()
  })

  describe('setupTabs', () => {
    it('should activate only the clicked tab', () => {
      const [first, second] = document.querySelectorAll('.tab-button')

      second.click()
      expect(second.classList.contains('active')).toBe(true)
      expect(first.classList.contains('active')).toBe(false)
      expect(
        document.getElementById('tabRenda').classList.contains('active'),
      ).toBe(true)
      expect(
        document.getElementById('tabJuros').classList.contains('active'),
      ).toBe(false)

      first.click()
      expect(first.classList.contains('active')).toBe(true)
      expect(second.classList.contains('active')).toBe(false)
    })
  })

  describe('setupMoneyMasks', () => {
    it('should mask inputs marked with data-money as the user types', () => {
      const input = document.getElementById('jurosAporteInicial')
      input.value = '12345'
      input.dispatchEvent(new window.Event('input'))
      expect(input.value).toMatch(/123,45$/)
    })

    it('should leave inputs without data-money untouched', () => {
      const input = document.getElementById('jurosAporteMensal')
      input.value = '12345'
      input.dispatchEvent(new window.Event('input'))
      expect(input.value).toBe('12345')
    })
  })

  describe('val / monthlyRateFrom / monthsFrom', () => {
    it('should parse pt-BR numbers from inputs and return 0 for unknown ids', () => {
      set('jurosAporteMensal', '1.234,56')
      expect(calculadora.val('jurosAporteMensal')).toBeCloseTo(1234.56, 2)
      expect(calculadora.val('naoExiste')).toBe(0)
    })

    it('should convert an annual rate to its monthly equivalent', () => {
      set('jurosTaxa', '12')
      set('jurosTaxaPeriodo', 'anual')
      expect(
        calculadora.monthlyRateFrom('jurosTaxa', 'jurosTaxaPeriodo'),
      ).toBeCloseTo(JurosMath.annualToMonthly(12), 10)
    })

    it('should take a monthly rate as-is', () => {
      set('jurosTaxa', '1')
      set('jurosTaxaPeriodo', 'mensal')
      expect(
        calculadora.monthlyRateFrom('jurosTaxa', 'jurosTaxaPeriodo'),
      ).toBeCloseTo(0.01, 10)
    })

    it('should convert years to months and take months as-is', () => {
      set('jurosTempo', '2')
      set('jurosTempoPeriodo', 'anos')
      expect(calculadora.monthsFrom('jurosTempo', 'jurosTempoPeriodo')).toBe(24)

      set('jurosTempoPeriodo', 'meses')
      expect(calculadora.monthsFrom('jurosTempo', 'jurosTempoPeriodo')).toBe(2)
    })
  })

  describe('calcularJuros', () => {
    beforeEach(() => {
      set('jurosAporteInicial', '1.000')
      set('jurosAporteMensal', '100')
      set('jurosTaxa', '1')
      set('jurosTaxaPeriodo', 'mensal')
      set('jurosTempo', '12')
      set('jurosTempoPeriodo', 'meses')
    })

    it('should render the amount, the invested total and the interest', () => {
      click('calcJurosBtn')

      const total = JurosMath.futureValue(1000, 100, 0.01, 12)
      expect(text('jurosMontante')).toBe(Format.currency(total))
      expect(text('jurosInvestido')).toBe(Format.currency(1000 + 100 * 12))
      expect(text('jurosJuros')).toBe(Format.currency(total - 2200))
      expect(text('jurosTaxaMensalInfo')).toContain('1,000%')
      expect(document.getElementById('jurosResultado').style.display).toBe(
        'block',
      )
    })

    it('should fill the evolution table with one row per year', () => {
      set('jurosTempo', '3')
      set('jurosTempoPeriodo', 'anos')
      click('calcJurosBtn')

      const rows = document.querySelectorAll('#jurosEvolucaoBody tr')
      expect(rows).toHaveLength(3)
      expect(rows[0].children).toHaveLength(4)
      expect(rows[0].children[0].textContent).toBe('1º')
      expect(rows[2].children[0].textContent).toBe('3º')
    })

    it('should replace the previous table instead of appending to it', () => {
      click('calcJurosBtn')
      click('calcJurosBtn')
      expect(document.querySelectorAll('#jurosEvolucaoBody tr')).toHaveLength(1)
    })

    it('should refuse a non-positive period', () => {
      set('jurosTempo', '0')
      click('calcJurosBtn')

      expect(alertSpy).toHaveBeenCalledWith('Informe um período válido.')
      expect(text('jurosMontante')).toBe('')
      expect(document.getElementById('jurosResultado').style.display).toBe('')
    })
  })

  describe('calcularViverDeRenda', () => {
    beforeEach(() => {
      set('rendaDesejada', '5.000')
      set('rendaTaxa', '0,5')
      set('rendaTaxaPeriodo', 'mensal')
    })

    it('should render the required capital', () => {
      click('calcRendaBtn')

      const capital = JurosMath.requiredCapitalForIncome(5000, 0.005)
      expect(text('rendaPatrimonio')).toBe(Format.currency(capital))
      expect(text('rendaExplicacao')).toContain('0,500%')
      expect(document.getElementById('rendaResultado').style.display).toBe(
        'block',
      )
    })

    it('should estimate how long it takes to reach that capital', () => {
      set('rendaAporteInicial', '10.000')
      set('rendaAporteMensal', '2.000')
      click('calcRendaBtn')

      expect(text('rendaTempo')).toMatch(/para chegar lá/)
    })

    it('should leave the time empty when there is no contribution', () => {
      set('rendaAporteInicial', '')
      set('rendaAporteMensal', '')
      click('calcRendaBtn')

      expect(text('rendaTempo')).toBe('')
    })

    it('should refuse a non-positive income', () => {
      set('rendaDesejada', '0')
      click('calcRendaBtn')

      expect(alertSpy).toHaveBeenCalledWith('Informe a renda mensal desejada.')
      expect(text('rendaPatrimonio')).toBe('')
    })
  })

  describe('compararInvestimentos', () => {
    beforeEach(() => {
      set('compararAporteInicial', '1.000')
      set('compararAporteMensal', '100')
      set('compararTempo', '12')
      set('compararTempoPeriodo', 'meses')
      set('compararTaxaAPeriodo', 'mensal')
      set('compararTaxaBPeriodo', 'mensal')
    })

    it('should mark A as the winner and show the difference', () => {
      set('compararTaxaA', '1')
      set('compararTaxaB', '0,5')
      click('calcCompararBtn')

      const totalA = JurosMath.futureValue(1000, 100, 0.01, 12)
      const totalB = JurosMath.futureValue(1000, 100, 0.005, 12)
      expect(text('compararMontanteA')).toBe(Format.currency(totalA))
      expect(text('compararMontanteB')).toBe(Format.currency(totalB))
      expect(text('compararVeredito')).toBe(
        `Investimento A rende ${Format.currency(totalA - totalB)} a mais no período.`,
      )
      expect(
        document.getElementById('compararCardA').classList.contains('winner'),
      ).toBe(true)
      expect(
        document.getElementById('compararCardB').classList.contains('winner'),
      ).toBe(false)
    })

    it('should mark B as the winner when B pays more', () => {
      set('compararTaxaA', '0,5')
      set('compararTaxaB', '1')
      click('calcCompararBtn')

      expect(text('compararVeredito')).toContain('Investimento B rende')
      expect(
        document.getElementById('compararCardB').classList.contains('winner'),
      ).toBe(true)
    })

    it('should report a tie without crowning a winner', () => {
      set('compararTaxaA', '1')
      set('compararTaxaB', '1')
      click('calcCompararBtn')

      expect(text('compararVeredito')).toBe(
        'Os dois investimentos rendem o mesmo valor.',
      )
      expect(
        document.getElementById('compararCardA').classList.contains('winner'),
      ).toBe(false)
      expect(
        document.getElementById('compararCardB').classList.contains('winner'),
      ).toBe(false)
    })

    it('should drop the winner class when a later run changes the answer', () => {
      set('compararTaxaA', '1')
      set('compararTaxaB', '0,5')
      click('calcCompararBtn')

      set('compararTaxaB', '2')
      click('calcCompararBtn')

      expect(
        document.getElementById('compararCardA').classList.contains('winner'),
      ).toBe(false)
      expect(
        document.getElementById('compararCardB').classList.contains('winner'),
      ).toBe(true)
    })

    it('should refuse a non-positive period', () => {
      set('compararTempo', '0')
      click('calcCompararBtn')

      expect(alertSpy).toHaveBeenCalledWith('Informe um período válido.')
      expect(text('compararMontanteA')).toBe('')
    })
  })

  describe('calcularAposentadoria', () => {
    beforeEach(() => {
      set('aposIdadeAtual', '30')
      set('aposIdadeAposentar', '60')
      set('aposAporteInicial', '10.000')
      set('aposAporteMensal', '1.000')
      set('aposTaxa', '0,5')
      set('aposTaxaPeriodo', 'mensal')
    })

    it('should project the accumulated capital and the income it generates', () => {
      set('aposRendaDesejada', '')
      click('calcAposentadoriaBtn')

      const patrimonio = JurosMath.futureValue(10000, 1000, 0.005, 360)
      expect(text('aposPatrimonio')).toBe(Format.currency(patrimonio))
      expect(text('aposRendaGerada')).toBe(Format.currency(patrimonio * 0.005))
      expect(text('aposResumo')).toContain('Em 30 anos')
      expect(text('aposMeta')).toBe('')
      expect(document.getElementById('aposResultado').style.display).toBe(
        'block',
      )
    })

    it('should celebrate a goal already covered by the projection', () => {
      set('aposRendaDesejada', '100')
      click('calcAposentadoriaBtn')

      expect(text('aposMeta')).toContain('Meta atingida')
    })

    it('should state the extra monthly contribution needed for the goal', () => {
      set('aposRendaDesejada', '50.000')
      click('calcAposentadoriaBtn')

      expect(text('aposMeta')).toContain('Aporte necessário')
      expect(text('aposMeta')).toContain('faltam')
    })

    it('should use the singular for a one-year horizon', () => {
      set('aposIdadeAposentar', '31')
      set('aposRendaDesejada', '')
      click('calcAposentadoriaBtn')

      expect(text('aposResumo')).toContain('Em 1 ano ')
    })

    it('should refuse a retirement age that is not in the future', () => {
      set('aposIdadeAposentar', '30')
      click('calcAposentadoriaBtn')

      expect(alertSpy).toHaveBeenCalledWith(
        'A idade de aposentadoria deve ser maior que a idade atual.',
      )
      expect(text('aposPatrimonio')).toBe('')
    })
  })

  describe('helpers tolerate a missing DOM', () => {
    it('should not throw when the elements are absent', () => {
      document.body.innerHTML = ''
      expect(() => new JurosCompostosCalculadora()).not.toThrow()
      expect(() => calculadora.setText('naoExiste', 'x')).not.toThrow()
      expect(() => calculadora.show('naoExiste')).not.toThrow()
      expect(() => calculadora.renderEvolution([])).not.toThrow()
    })
  })
})
