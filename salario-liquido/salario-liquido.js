// Calculadora de Salário Líquido
// Atualizar anualmente conforme as portarias vigentes (INSS/Receita Federal)

// Tabela de INSS 2026 — salário mínimo R$ 1.621,00, teto R$ 8.475,55
// Fonte: portaria interministerial de reajuste do RGPS para 2026
const inssTable = [
  { min: 0, max: 1621.0, rate: 0.075 },
  { min: 1621.01, max: 2902.84, rate: 0.09 },
  { min: 2902.85, max: 4354.27, rate: 0.12 },
  { min: 4354.28, max: 8475.55, rate: 0.14 },
]

// Contribuição máxima: soma progressiva de cada faixa dentro do seu próprio
// intervalo. Derivada da tabela para nunca sair de sincronia com ela.
const inssCeiling = inssTable.reduce(
  (total, bracket, index) =>
    total +
    (bracket.max - (index === 0 ? 0 : inssTable[index - 1].max)) * bracket.rate,
  0,
)

// Calcular INSS progressivo
function calculateINSS(grossSalary) {
  if (typeof grossSalary !== 'number' || isNaN(grossSalary)) {
    return { value: 0, rate: 0 }
  }

  let inss = 0
  let remainingSalary = grossSalary
  let currentRate = 0

  for (const bracket of inssTable) {
    if (grossSalary >= bracket.min) {
      currentRate = bracket.rate
    }

    if (remainingSalary <= 0) break

    const bracketMin = bracket.min
    const bracketMax = bracket.max
    const bracketRate = bracket.rate

    const bracketSalary = Math.min(
      remainingSalary,
      bracketMax - bracketMin + (bracketMin === 0 ? 0 : 0.01),
    )

    if (grossSalary > bracketMin) {
      const taxableInThisBracket = Math.min(
        grossSalary - bracketMin,
        bracketMax - bracketMin + (bracketMin === 0 ? 0 : 0.01),
      )
      inss += taxableInThisBracket * bracketRate
    }

    remainingSalary -= bracketSalary
  }

  return {
    value: Math.min(inss, inssCeiling),
    rate: grossSalary < 0 ? 0 : currentRate,
  }
}

// Tabela progressiva de IRRF 2026
const irrfTable = [
  { min: 0, max: 2428.8, rate: 0, deduction: 0 },
  { min: 2428.81, max: 2826.65, rate: 0.075, deduction: 182.16 },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 394.16 },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 675.49 },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 908.73 },
]

const dependentDeduction = 189.59 // Valor por dependente
const simplifiedDiscount = 607.2 // Desconto simplificado mensal

// Redutor da Lei 15.270/2025, aplicado sobre os rendimentos tributáveis:
// isenção total até R$ 5.000,00 e redução decrescente até R$ 7.350,00.
const REDUCTION_FULL_EXEMPTION_LIMIT = 5000.0
const REDUCTION_UPPER_LIMIT = 7350.0
const REDUCTION_BASE = 978.62
const REDUCTION_COEFFICIENT = 0.133145

// Determinar alíquota do INSS para exibição
function getINSSRate(grossSalary) {
  return calculateINSS(grossSalary).rate
}

// Imposto pela tabela progressiva, antes do redutor da Lei 15.270/2025
function calculateProgressiveIRRF(taxableBase) {
  for (const bracket of irrfTable) {
    if (taxableBase >= bracket.min && taxableBase <= bracket.max) {
      return Math.max(0, taxableBase * bracket.rate - bracket.deduction)
    }
  }
  return 0
}

// Redutor da Lei 15.270/2025 sobre o imposto apurado.
// Só faz sentido na faixa de redução; fora dela o chamador não o aplica.
function calculateIRRFReduction(grossIncome) {
  return Math.max(0, REDUCTION_BASE - REDUCTION_COEFFICIENT * grossIncome)
}

// Calcular IRRF: tabela progressiva sobre a base de cálculo, ajustada pelo
// redutor da Lei 15.270/2025, que olha para os rendimentos tributáveis brutos.
function calculateIRRF(taxableBase, grossIncome) {
  const progressiveIRRF = calculateProgressiveIRRF(taxableBase)
  if (progressiveIRRF === 0) return 0

  if (grossIncome <= REDUCTION_FULL_EXEMPTION_LIMIT) return 0
  if (grossIncome > REDUCTION_UPPER_LIMIT) return progressiveIRRF

  return Math.max(0, progressiveIRRF - calculateIRRFReduction(grossIncome))
}

// Determinar alíquota do IRRF para exibição. Retorna 0 (isento) quando o
// redutor zera o imposto, para não exibir alíquota sobre imposto inexistente.
function getIRRFRate(taxableBase, grossIncome) {
  if (calculateIRRF(taxableBase, grossIncome) === 0) return 0

  for (const bracket of irrfTable) {
    if (taxableBase >= bracket.min && taxableBase <= bracket.max) {
      return bracket.rate
    }
  }
  return 0
}

// Validar vale transporte (máximo 6% do salário bruto)
function validateTransportVoucher(transportValue, grossSalary) {
  const maxTransport = grossSalary * 0.06
  return Math.max(0, Math.min(transportValue, maxTransport))
}

// Calcular base de cálculo do IRRF. Na retenção mensal aplica-se o desconto
// simplificado quando ele for mais vantajoso que as deduções legais.
function calculateIRRFBase(grossSalary, inssValue, dependents, healthPlan) {
  const legalDeductions =
    inssValue + dependents * dependentDeduction + healthPlan
  return grossSalary - Math.max(legalDeductions, simplifiedDiscount)
}

// Calcular total de descontos opcionais
function calculateTotalOptionalDeductions(
  healthPlan,
  mealVoucher,
  transportVoucher,
  otherDeductions,
) {
  return healthPlan + mealVoucher + transportVoucher + otherDeductions
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
  const inssResult = calculateINSS(grossSalary)
  const inssValue = inssResult.value
  const inssRate = inssResult.rate

  // Base de cálculo do IRRF (maior entre deduções legais e desconto simplificado)
  const irrfBase = calculateIRRFBase(
    grossSalary,
    inssValue,
    dependents,
    healthPlan,
  )

  // Calcular IRRF (o redutor da Lei 15.270/2025 olha para o rendimento bruto)
  const irrfValue = calculateIRRF(Math.max(0, irrfBase), grossSalary)
  const irrfRate = getIRRFRate(Math.max(0, irrfBase), grossSalary)

  // Descontos totais
  const totalOptionalDeductions = calculateTotalOptionalDeductions(
    healthPlan,
    mealVoucher,
    transportVoucher,
    otherDeductions,
  )
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
      results.grossSalary,
    )
    document.getElementById('displayNetSalary').textContent = formatCurrency(
      results.netSalary,
    )
    document.getElementById('displayTotalDeductions').textContent =
      formatCurrency(results.totalDeductions)

    // Descontos obrigatórios
    document.getElementById('inssDeduction').textContent = formatCurrency(
      results.inss.value,
    )
    document.getElementById('inssRate').textContent =
      `(${(results.inss.rate * 100).toFixed(1)}%)`

    document.getElementById('irrfDeduction').textContent = formatCurrency(
      results.irrf.value,
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
        'transportVoucherDeduction',
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
        'otherDeductionsDeduction',
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
        document.getElementById('transportVoucher').value,
      ),
      otherDeductions: parseCurrency(
        document.getElementById('otherDeductions').value,
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
  module.exports = {
    calculateINSS,
    getINSSRate,
    inssTable,
    irrfTable,
    calculateProgressiveIRRF,
    calculateIRRFReduction,
    calculateNetSalary,
    calculateIRRF,
    getIRRFRate,
    validateTransportVoucher,
    calculateIRRFBase,
    calculateTotalOptionalDeductions,
  }
}
