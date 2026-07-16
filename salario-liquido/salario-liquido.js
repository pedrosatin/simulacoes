// Calculadora de Salário Líquido
// Tabelas atualizadas para 2025

// Tabelas de INSS 2025
const inssTable = [
  { min: 0, max: 1412.0, rate: 0.075 },
  { min: 1412.01, max: 2666.68, rate: 0.09 },
  { min: 2666.69, max: 4000.03, rate: 0.12 },
  { min: 4000.04, max: 7786.02, rate: 0.14 },
]

// Calcular INSS progressivo
function calculateINSS(grossSalary) {
  let inss = 0
  let remainingSalary = grossSalary

  for (const bracket of inssTable) {
    if (remainingSalary <= 0) break

    const bracketMin = bracket.min
    const bracketMax = bracket.max
    const bracketRate = bracket.rate

    const bracketSalary = Math.min(
      remainingSalary,
      bracketMax - bracketMin + (bracketMin === 0 ? 0 : 0.01)
    )

    if (grossSalary > bracketMin) {
      const taxableInThisBracket = Math.min(
        grossSalary - bracketMin,
        bracketMax - bracketMin + (bracketMin === 0 ? 0 : 0.01)
      )
      inss += taxableInThisBracket * bracketRate
    }

    remainingSalary -= bracketSalary
  }

  // Teto do INSS 2025
  const inssCeiling = 7786.02 * 0.14 // R$ 1.090.04
  return Math.min(inss, inssCeiling)
}

// Tabelas de IRRF 2025
const irrfTable = [
  { min: 0, max: 2259.2, rate: 0, deduction: 0 },
  { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.0 },
]

const dependentDeduction = 189.59 // Valor por dependente em 2025

// Determinar alíquota do INSS para exibição
function getINSSRate(grossSalary) {
  for (let i = inssTable.length - 1; i >= 0; i--) {
    if (grossSalary >= inssTable[i].min) {
      return inssTable[i].rate
    }
  }
  return 0
}

// Calcular IRRF
function calculateIRRF(taxableIncome) {
  for (const bracket of irrfTable) {
    if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
      const irrf = taxableIncome * bracket.rate - bracket.deduction
      return Math.max(0, irrf)
    }
  }
  return 0
}

// Determinar alíquota do IRRF para exibição
function getIRRFRate(taxableIncome) {
  for (const bracket of irrfTable) {
    if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
      return bracket.rate
    }
  }
  return 0
}

// Validar vale transporte (máximo 6% do salário bruto)
function validateTransportVoucher(transportValue, grossSalary) {
  const maxTransport = grossSalary * 0.06
  return Math.min(transportValue, maxTransport)
}

// Calcular salário líquido
function calculateNetSalary(data) {
  const grossSalary = data.grossSalary
  const dependents = data.dependents
  const healthPlan = data.healthPlan
  const mealVoucher = data.mealVoucher
  let transportVoucher = data.transportVoucher
  const otherDeductions = data.otherDeductions

  // Validar vale transporte
  transportVoucher = validateTransportVoucher(transportVoucher, grossSalary)

  // Calcular INSS
  const inssValue = calculateINSS(grossSalary)
  const inssRate = getINSSRate(grossSalary)

  // Base de cálculo do IRRF (Salário bruto - INSS - dependentes - plano de saúde)
  const dependentDeductions = dependents * dependentDeduction
  const irrfBase = grossSalary - inssValue - dependentDeductions - healthPlan

  // Calcular IRRF
  const irrfValue = calculateIRRF(Math.max(0, irrfBase))
  const irrfRate = getIRRFRate(Math.max(0, irrfBase))

  // Descontos totais
  const totalOptionalDeductions =
    healthPlan + mealVoucher + transportVoucher + otherDeductions
  const totalDeductions = inssValue + irrfValue + totalOptionalDeductions

  // Salário líquido
  const netSalary = grossSalary - totalDeductions

  return {
    grossSalary,
    netSalary,
    totalDeductions,
    inss: {
      value: inssValue,
      rate: inssRate,
    },
    irrf: {
      value: irrfValue,
      rate: irrfRate,
    },
    optional: {
      healthPlan,
      mealVoucher,
      transportVoucher,
      otherDeductions,
      total: totalOptionalDeductions,
    },
    hasOptionalDeductions: totalOptionalDeductions > 0,
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const salaryForm = document.getElementById('salaryForm')
  const resultsSection = document.getElementById('salaryResults')

  // Formatação monetária
  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  function formatCurrency(value) {
    return currencyFormatter.format(value)
  }

  // Converter string monetária para número
  function parseCurrency(value) {
    if (!value) return 0
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
  }

  // Aplicar máscara monetária
  function applyMoneyMask(input) {
    let value = input.value.replace(/\D/g, '')
    if (value) {
      value = (parseInt(value) / 100).toFixed(2)
      value = value.replace('.', ',')
      value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      input.value = 'R$ ' + value
    } else {
      input.value = ''
    }
  }

  // Adicionar máscaras monetárias aos inputs
  const moneyInputs = [
    'grossSalary',
    'healthPlan',
    'mealVoucher',
    'transportVoucher',
    'otherDeductions',
  ]
  moneyInputs.forEach((inputId) => {
    const input = document.getElementById(inputId)
    input.addEventListener('input', () => applyMoneyMask(input))
    input.addEventListener('blur', () => {
      if (!input.value) input.value = ''
    })
  })

  // Exibir resultados
  function displayResults(results) {
    // Salário bruto e líquido
    document.getElementById('displayGrossSalary').textContent = formatCurrency(
      results.grossSalary
    )
    document.getElementById('displayNetSalary').textContent = formatCurrency(
      results.netSalary
    )
    document.getElementById('displayTotalDeductions').textContent =
      formatCurrency(results.totalDeductions)

    // Descontos obrigatórios
    document.getElementById('inssDeduction').textContent = formatCurrency(
      results.inss.value
    )
    document.getElementById('inssRate').textContent = `(${(
      results.inss.rate * 100
    ).toFixed(1)}%)`

    document.getElementById('irrfDeduction').textContent = formatCurrency(
      results.irrf.value
    )
    document.getElementById('irrfRate').textContent =
      results.irrf.rate > 0
        ? `(${(results.irrf.rate * 100).toFixed(1)}%)`
        : '(isento)'

    // Descontos opcionais
    const optionalSection = document.getElementById('optionalDeductionsSection')
    if (results.hasOptionalDeductions) {
      optionalSection.style.display = 'block'

      // Plano de saúde
      const healthPlanDiv = document.getElementById('healthPlanDeduction')
      if (results.optional.healthPlan > 0) {
        healthPlanDiv.style.display = 'flex'
        healthPlanDiv.querySelector('.deduction-value').textContent =
          formatCurrency(results.optional.healthPlan)
      } else {
        healthPlanDiv.style.display = 'none'
      }

      // Vale refeição
      const mealVoucherDiv = document.getElementById('mealVoucherDeduction')
      if (results.optional.mealVoucher > 0) {
        mealVoucherDiv.style.display = 'flex'
        mealVoucherDiv.querySelector('.deduction-value').textContent =
          formatCurrency(results.optional.mealVoucher)
      } else {
        mealVoucherDiv.style.display = 'none'
      }

      // Vale transporte
      const transportVoucherDiv = document.getElementById(
        'transportVoucherDeduction'
      )
      if (results.optional.transportVoucher > 0) {
        transportVoucherDiv.style.display = 'flex'
        transportVoucherDiv.querySelector('.deduction-value').textContent =
          formatCurrency(results.optional.transportVoucher)
      } else {
        transportVoucherDiv.style.display = 'none'
      }

      // Outros descontos
      const otherDeductionsDiv = document.getElementById(
        'otherDeductionsDeduction'
      )
      if (results.optional.otherDeductions > 0) {
        otherDeductionsDiv.style.display = 'flex'
        otherDeductionsDiv.querySelector('.deduction-value').textContent =
          formatCurrency(results.optional.otherDeductions)
      } else {
        otherDeductionsDiv.style.display = 'none'
      }
    } else {
      optionalSection.style.display = 'none'
    }

    // Mostrar resultados
    resultsSection.style.display = 'block'
    resultsSection.scrollIntoView({ behavior: 'smooth' })
  }

  // Event listener do formulário
  salaryForm.addEventListener('submit', function (e) {
    e.preventDefault()

    // Coletar dados do formulário
    const formData = {
      grossSalary: parseCurrency(document.getElementById('grossSalary').value),
      dependents: parseInt(document.getElementById('dependents').value) || 0,
      healthPlan: parseCurrency(document.getElementById('healthPlan').value),
      mealVoucher: parseCurrency(document.getElementById('mealVoucher').value),
      transportVoucher: parseCurrency(
        document.getElementById('transportVoucher').value
      ),
      otherDeductions: parseCurrency(
        document.getElementById('otherDeductions').value
      ),
    }

    // Validações básicas
    if (formData.grossSalary <= 0) {
      alert('Por favor, insira um salário bruto válido.')
      return
    }

    if (formData.dependents < 0) {
      alert('O número de dependentes não pode ser negativo.')
      return
    }

    // Calcular e exibir resultados
    const results = calculateNetSalary(formData)
    displayResults(results)
  })

  // Inicializar campos com valores padrão
  document.getElementById('dependents').value = '0'
})

// Exportar para testes (apenas se estiver em ambiente Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateINSS, inssTable, calculateNetSalary, calculateIRRF, getIRRFRate }
}
