/**
 * @jest-environment jsdom
 *
 * Testes de comportamento da camada de UI de Salário Líquido.
 */

const MARKUP = `
  <form id="salaryForm">
    <input id="grossSalary" value="">
    <input id="dependents" value="">
    <input id="healthPlan" value="">
    <input id="mealVoucher" value="">
    <input id="transportVoucher" value="">
    <input id="otherDeductions" value="">
    <button type="submit" id="submitBtn">Calcular</button>
  </form>
  <div id="salaryResults" style="display: none;">
    <span id="displayGrossSalary"></span>
    <span id="displayNetSalary"></span>
    <span id="displayTotalDeductions"></span>
    <span id="inssDeduction"></span>
    <span id="inssRate"></span>
    <span id="irrfDeduction"></span>
    <span id="irrfRate"></span>
    <div id="optionalDeductionsSection" style="display: none;">
      <div id="healthPlanDeduction" style="display: none;"><span class="deduction-value"></span></div>
      <div id="mealVoucherDeduction" style="display: none;"><span class="deduction-value"></span></div>
      <div id="transportVoucherDeduction" style="display: none;"><span class="deduction-value"></span></div>
      <div id="otherDeductionsDeduction" style="display: none;"><span class="deduction-value"></span></div>
    </div>
  </div>
`

describe('Salário Líquido UI', () => {
  let alertMock

  beforeEach(() => {
    document.body.innerHTML = MARKUP
    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {})

    // Carregar o script para registrar o event listener DOMContentLoaded
    jest.isolateModules(() => {
      require('./salario-liquido.js')
    })

    document.dispatchEvent(new Event('DOMContentLoaded'))
  })

  afterEach(() => {
    alertMock.mockRestore()
  })

  it('should initialize dependents with 0', () => {
    expect(document.getElementById('dependents').value).toBe('0')
  })

  it('should alert and abort when gross salary is 0 or negative', () => {
    document.getElementById('grossSalary').value = '0'
    document.getElementById('salaryForm').dispatchEvent(new Event('submit'))

    expect(alertMock).toHaveBeenCalledWith(
      'Por favor, insira um salário bruto válido.',
    )
    expect(document.getElementById('salaryResults').style.display).toBe('none')
  })

  it('should alert and abort when dependents is negative', () => {
    document.getElementById('grossSalary').value = '3000'
    document.getElementById('dependents').value = '-1'
    document.getElementById('salaryForm').dispatchEvent(new Event('submit'))

    expect(alertMock).toHaveBeenCalledWith(
      'O número de dependentes não pode ser negativo.',
    )
    expect(document.getElementById('salaryResults').style.display).toBe('none')
  })

  it('should calculate and render results correctly without optional deductions', () => {
    document.getElementById('grossSalary').value = '5.000,00'
    document.getElementById('dependents').value = '0'
    document.getElementById('salaryForm').dispatchEvent(new Event('submit'))

    expect(document.getElementById('salaryResults').style.display).toBe('block')
    expect(document.getElementById('displayGrossSalary').textContent).toContain(
      '5.000,00',
    )
    expect(document.getElementById('inssDeduction').textContent).not.toBe('')
    expect(document.getElementById('displayNetSalary').textContent).not.toBe('')
    expect(
      document.getElementById('optionalDeductionsSection').style.display,
    ).toBe('none')
  })

  it('should render optional deductions section when provided', () => {
    document.getElementById('grossSalary').value = '6.000,00'
    document.getElementById('dependents').value = '1'
    document.getElementById('healthPlan').value = '150,00'
    document.getElementById('mealVoucher').value = '50,00'
    document.getElementById('transportVoucher').value = '100,00'
    document.getElementById('otherDeductions').value = '25,00'

    document.getElementById('salaryForm').dispatchEvent(new Event('submit'))

    const optionalSection = document.getElementById('optionalDeductionsSection')
    expect(optionalSection.style.display).toBe('block')

    expect(document.getElementById('healthPlanDeduction').style.display).toBe(
      'flex',
    )
    expect(
      document.getElementById('healthPlanDeduction').textContent,
    ).toContain('150,00')

    expect(document.getElementById('mealVoucherDeduction').style.display).toBe(
      'flex',
    )
    expect(
      document.getElementById('mealVoucherDeduction').textContent,
    ).toContain('50,00')

    expect(
      document.getElementById('transportVoucherDeduction').style.display,
    ).toBe('flex')
    expect(
      document.getElementById('transportVoucherDeduction').textContent,
    ).toContain('100,00')

    expect(
      document.getElementById('otherDeductionsDeduction').style.display,
    ).toBe('flex')
    expect(
      document.getElementById('otherDeductionsDeduction').textContent,
    ).toContain('25,00')
  })
})
