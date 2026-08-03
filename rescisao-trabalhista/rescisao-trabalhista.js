/**
 * Calculadora de Rescisão Trabalhista
 *
 * Este arquivo contém toda a lógica para calcular verbas rescisórias
 * considerando diferentes tipos de rescisão e particularidades trabalhistas.
 *
 * Funcionalidades:
 * - Cálculo de saldo de salário
 * - Aviso prévio (trabalhado ou indenizado)
 * - 13º salário proporcional
 * - Férias vencidas e proporcionais + 1/3
 * - Multa do FGTS (40%, 20% ou sem multa)
 * - Validação de datas e valores
 * - Formatação monetária brasileira
 */

// Constantes para cálculos trabalhistas
const CONSTANTS = {
  DIAS_MES: 30,
  ADICIONAL_FERIAS: 1 / 3, // 1/3 constitucional
  AVISO_PREVIO_BASE: 30, // 30 dias base
  AVISO_PREVIO_ADICIONAL: 3, // 3 dias por ano trabalhado
  MULTA_FGTS_DEMISSAO: 0.4, // 40%
  MULTA_FGTS_ACORDO: 0.2, // 20%
  MULTA_FGTS_SAQUE_ANIVERSARIO: 0.2, // 20% para optantes do saque-aniversário
  SALARIO_MINIMO_2025: 1518, // Salário mínimo 2025
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function () {
  initializeCalculator()
  setupEventListeners()
  updateCurrentDate()
  setDefaultDates()
})

/**
 * Inicializa a calculadora definindo valores padrão
 */
function initializeCalculator() {
  // Define data atual para a data de rescisão
  const today = new Date()
  const dataRescisaoInput = document.getElementById('dataRescisao')
  dataRescisaoInput.value = formatDateForInput(today)

  // Define data de admissão como 1 ano atrás por padrão
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(today.getFullYear() - 1)
  const dataAdmissaoInput = document.getElementById('dataAdmissao')
  dataAdmissaoInput.value = formatDateForInput(oneYearAgo)
}

/**
 * Configura os event listeners para os elementos da interface
 */
function setupEventListeners() {
  // Máscara monetária para campos de valor
  const salarioInput = document.getElementById('salario')
  const fgtsInput = document.getElementById('saldoFGTS')

  salarioInput.addEventListener('input', function (e) {
    applyMoneyMask(e.target)
  })

  fgtsInput.addEventListener('input', function (e) {
    applyMoneyMask(e.target)
  })

  // Listener para mudança no tipo de rescisão
  const tipoRescisaoSelect = document.getElementById('tipoRescisao')
  tipoRescisaoSelect.addEventListener('change', function () {
    updateFormBasedOnRescisionType()
  })

  // Listener para cálculo automático quando campos importantes mudam
  const formInputs = [
    'salario',
    'dataAdmissao',
    'dataRescisao',
    'tipoRescisao',
    'diasAviso',
    'feriasVencidas',
    'saqueAniversario',
    'saldoFGTS',
  ]

  formInputs.forEach((id) => {
    const element = document.getElementById(id)
    if (element) {
      element.addEventListener('change', function () {
        if (validateBasicInputs()) {
          calculateRescision()
        }
      })
    }
  })

  // Botão de calcular
  const calcularBtn = document.getElementById('calcularRescisao')
  calcularBtn.addEventListener('click', function () {
    calculateRescision()
  })

  // Validação de datas em tempo real
  const dataAdmissaoInput = document.getElementById('dataAdmissao')
  const dataRescisaoInput = document.getElementById('dataRescisao')

  dataAdmissaoInput.addEventListener('change', validateDates)
  dataRescisaoInput.addEventListener('change', validateDates)
}

/**
 * Atualiza a interface baseada no tipo de rescisão selecionado
 */
function updateFormBasedOnRescisionType() {
  const tipoRescisao = document.getElementById('tipoRescisao').value

  // Reseta campo de aviso prévio
  const diasAvisoInput = document.getElementById('diasAviso')

  switch (tipoRescisao) {
    case 'demissao-justa-causa':
      // Em demissão por justa causa, não há aviso prévio
      diasAvisoInput.value = '0'
      diasAvisoInput.disabled = true
      break
    case 'acordo':
      // Em acordo, aviso prévio é reduzido pela metade
      diasAvisoInput.disabled = false
      break
    default:
      diasAvisoInput.disabled = false
      break
  }

  // Recalcula automaticamente se campos básicos estão preenchidos
  if (validateBasicInputs()) {
    calculateRescision()
  }
}

/**
 * Valida se as datas inseridas são consistentes
 */
function validateDates() {
  const dataAdmissao = new Date(document.getElementById('dataAdmissao').value)
  const dataRescisao = new Date(document.getElementById('dataRescisao').value)

  if (dataAdmissao >= dataRescisao) {
    alert('Data de rescisão deve ser posterior à data de admissão')
    return false
  }

  // Verifica se a data de rescisão não é muito no futuro
  const today = new Date()
  const maxFutureDate = new Date(today)
  maxFutureDate.setFullYear(today.getFullYear() + 1)

  if (dataRescisao > maxFutureDate) {
    alert('Data de rescisão não pode ser superior a 1 ano da data atual')
    return false
  }

  return true
}

/**
 * Valida se os campos básicos estão preenchidos
 */
function validateBasicInputs() {
  const salario = parseMoneyToFloat(document.getElementById('salario').value)
  const dataAdmissao = document.getElementById('dataAdmissao').value
  const dataRescisao = document.getElementById('dataRescisao').value

  return salario > 0 && dataAdmissao && dataRescisao
}

/**
 * Função principal de cálculo da rescisão
 */
function calculateRescision() {
  try {
    // Validações iniciais
    if (!validateBasicInputs()) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (!validateDates()) {
      return
    }

    // Coleta dados do formulário
    const dados = collectFormData()

    // Validações adicionais
    if (dados.salario < CONSTANTS.SALARIO_MINIMO_2025) {
      if (
        !confirm(
          `O salário informado (${formatMoney(
            dados.salario,
          )}) está abaixo do salário mínimo (${formatMoney(
            CONSTANTS.SALARIO_MINIMO_2025,
          )}). Deseja continuar?`,
        )
      ) {
        return
      }
    }

    // Calcula período trabalhado
    const periodoTrabalhado = calculateWorkPeriod(
      dados.dataAdmissao,
      dados.dataRescisao,
    )

    // Calcula cada verba rescisória
    const verbas = calculateRescisionBenefits(dados, periodoTrabalhado)

    // Exibe resultados
    displayResults(verbas, periodoTrabalhado, dados)
  } catch (error) {
    console.error('Erro ao calcular rescisão:', error)
    alert('Erro ao calcular a rescisão. Verifique os dados informados.')
  }
}

/**
 * Coleta dados do formulário
 */
function collectFormData() {
  return {
    salario: parseMoneyToFloat(document.getElementById('salario').value),
    dataAdmissao: new Date(document.getElementById('dataAdmissao').value),
    dataRescisao: new Date(document.getElementById('dataRescisao').value),
    tipoRescisao: document.getElementById('tipoRescisao').value,
    diasAviso: parseInt(document.getElementById('diasAviso').value) || 0,
    feriasVencidas:
      parseFloat(document.getElementById('feriasVencidas').value) || 0,
    saqueAniversario: document.getElementById('saqueAniversario').checked,
    saldoFGTS:
      parseMoneyToFloat(document.getElementById('saldoFGTS').value) || 0,
  }
}

/**
 * Calcula os anos completos trabalhados
 */
function calculateCompleteYears(tempDate, dataRescisao) {
  let anos = 0
  while (
    tempDate.getFullYear() < dataRescisao.getFullYear() ||
    (tempDate.getFullYear() === dataRescisao.getFullYear() &&
      tempDate.getMonth() < dataRescisao.getMonth()) ||
    (tempDate.getFullYear() === dataRescisao.getFullYear() &&
      tempDate.getMonth() === dataRescisao.getMonth() &&
      tempDate.getDate() <= dataRescisao.getDate())
  ) {
    const nextYear = new Date(tempDate)
    nextYear.setFullYear(tempDate.getFullYear() + 1)

    if (nextYear <= dataRescisao) {
      anos++
      tempDate.setTime(nextYear.getTime())
    } else {
      break
    }
  }
  return anos
}

/**
 * Calcula os meses completos trabalhados
 */
function calculateCompleteMonths(tempDate, dataRescisao) {
  let meses = 0
  while (
    tempDate.getMonth() < dataRescisao.getMonth() ||
    (tempDate.getMonth() === dataRescisao.getMonth() &&
      tempDate.getDate() <= dataRescisao.getDate())
  ) {
    const nextMonth = new Date(tempDate)
    nextMonth.setMonth(tempDate.getMonth() + 1)

    if (nextMonth <= dataRescisao) {
      meses++
      tempDate.setTime(nextMonth.getTime())
    } else {
      break
    }
  }
  return meses
}

/**
 * Calcula os dias restantes trabalhados
 */
function calculateRemainingDays(tempDate, dataRescisao) {
  const diffFinal = dataRescisao.getTime() - tempDate.getTime()
  return Math.floor(diffFinal / (1000 * 60 * 60 * 24))
}

/**
 * Calcula o período trabalhado em anos, meses e dias
 */
function calculateWorkPeriod(dataAdmissao, dataRescisao) {
  const diffTime = dataRescisao.getTime() - dataAdmissao.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Cálculo mais preciso usando datas
  let tempDate = new Date(dataAdmissao)

  const anos = calculateCompleteYears(tempDate, dataRescisao)
  const meses = calculateCompleteMonths(tempDate, dataRescisao)
  const dias = calculateRemainingDays(tempDate, dataRescisao)

  return {
    anos,
    meses,
    dias,
    totalDias: diffDays,
    totalMeses: anos * 12 + meses + (dias > 14 ? 1 : 0), // Meses para cálculo proporcional (15 dias = 1 mês)
  }
}

/**
 * Calcula todas as verbas rescisórias
 */
function calculateRescisionBenefits(dados, periodo) {
  const verbas = {
    saldoSalario: 0,
    avisoPrevio: 0,
    decimoTerceiro: 0,
    feriasVencidas: 0,
    feriasProporcionais: 0,
    multaFGTS: 0,
    total: 0,
  }

  // Calcula saldo de salário (dias trabalhados no mês da rescisão)
  verbas.saldoSalario = calculateSalaryBalance(dados)

  // Calcula aviso prévio
  verbas.avisoPrevio = calculatePriorNotice(dados, periodo)

  // Calcula 13º salário
  verbas.decimoTerceiro = calculateThirteenthSalary(dados, periodo)

  // Calcula férias vencidas
  verbas.feriasVencidas = calculateVacationDue(dados)

  // Calcula férias proporcionais
  verbas.feriasProporcionais = calculateProportionalVacation(dados, periodo)

  // Calcula multa do FGTS
  verbas.multaFGTS = calculateFGTSPenalty(dados)

  // Calcula total
  verbas.total = Object.values(verbas).reduce((sum, valor) => sum + valor, 0)

  return verbas
}

/**
 * Calcula saldo de salário (dias trabalhados no mês da rescisão)
 */
function calculateSalaryBalance(dados) {
  const diaRescisao = dados.dataRescisao.getDate()

  return (dados.salario / CONSTANTS.DIAS_MES) * diaRescisao
}

/**
 * Calcula aviso prévio
 */
function calculatePriorNotice(dados, periodo) {
  // Justa causa não tem direito a aviso prévio
  if (dados.tipoRescisao === 'demissao-justa-causa') {
    return 0
  }

  // Pedido de demissão: apenas se o empregado der aviso prévio ao empregador
  if (dados.tipoRescisao === 'pedido-demissao' && dados.diasAviso === 0) {
    return 0
  }

  // Calcula dias de aviso prévio baseado no tempo de serviço
  let diasAviso = CONSTANTS.AVISO_PREVIO_BASE // 30 dias base
  diasAviso += periodo.anos * CONSTANTS.AVISO_PREVIO_ADICIONAL // +3 dias por ano
  diasAviso = Math.min(diasAviso, 90) // Máximo 90 dias

  // Se foi trabalhado parte do aviso, desconta
  if (dados.diasAviso > 0) {
    diasAviso -= dados.diasAviso
  }

  // Acordo: apenas 50% do aviso prévio
  if (dados.tipoRescisao === 'acordo') {
    diasAviso = diasAviso * 0.5
  }

  return (dados.salario / CONSTANTS.DIAS_MES) * diasAviso
}

/**
 * Calcula 13º salário proporcional
 */
function calculateThirteenthSalary(dados, _periodo) {
  // Justa causa não tem direito ao 13º proporcional
  if (dados.tipoRescisao === 'demissao-justa-causa') {
    return 0
  }

  // Calcula meses trabalhados no ano da rescisão
  const anoRescisao = dados.dataRescisao.getFullYear()
  const mesRescisao = dados.dataRescisao.getMonth() + 1 // Janeiro = 1

  // Se foi admitido no mesmo ano, conta apenas os meses trabalhados neste ano
  let mesesTrabalhados
  if (dados.dataAdmissao.getFullYear() === anoRescisao) {
    const mesAdmissao = dados.dataAdmissao.getMonth() + 1
    mesesTrabalhados = mesRescisao - mesAdmissao + 1
  } else {
    mesesTrabalhados = mesRescisao
  }

  // Considera 15 dias ou mais como mês completo
  const diaRescisao = dados.dataRescisao.getDate()
  if (diaRescisao >= 15) {
    // Já contado no cálculo de meses acima
  } else {
    mesesTrabalhados = Math.max(0, mesesTrabalhados - 1)
  }

  return (dados.salario / 12) * mesesTrabalhados
}

/**
 * Calcula férias vencidas
 */
function calculateVacationDue(dados) {
  // Justa causa só tem direito se as férias já estavam vencidas
  const valorFerias = dados.salario * dados.feriasVencidas
  const adicionalUmTerco = valorFerias * CONSTANTS.ADICIONAL_FERIAS

  return valorFerias + adicionalUmTerco
}

/**
 * Calcula férias proporcionais
 */
function calculateProportionalVacation(dados, _periodo) {
  // Justa causa não tem direito a férias proporcionais
  if (dados.tipoRescisao === 'demissao-justa-causa') {
    return 0
  }

  // Calcula meses trabalhados no período aquisitivo atual
  const ultimoAniversario = new Date(dados.dataAdmissao)

  // Encontra o último aniversário de contrato antes da rescisão
  while (ultimoAniversario.getTime() <= dados.dataRescisao.getTime()) {
    ultimoAniversario.setFullYear(ultimoAniversario.getFullYear() + 1)
  }
  ultimoAniversario.setFullYear(ultimoAniversario.getFullYear() - 1)

  // Calcula meses desde o último aniversário
  const diffTime = dados.dataRescisao.getTime() - ultimoAniversario.getTime()
  const mesesProporcionais = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))

  // Considera 15 dias ou mais como mês completo
  const diasRestantes = Math.floor(
    (diffTime % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24),
  )
  const mesesAjustados = mesesProporcionais + (diasRestantes >= 15 ? 1 : 0)

  const valorFerias = (dados.salario / 12) * mesesAjustados
  const adicionalUmTerco = valorFerias * CONSTANTS.ADICIONAL_FERIAS

  return valorFerias + adicionalUmTerco
}

/**
 * Calcula multa do FGTS
 */
function calculateFGTSPenalty(dados) {
  // Apenas demissão sem justa causa e acordo têm multa
  if (
    dados.tipoRescisao === 'demissao-justa-causa' ||
    dados.tipoRescisao === 'pedido-demissao'
  ) {
    return 0
  }

  // Se não informou saldo do FGTS, não calcula multa
  if (dados.saldoFGTS === 0) {
    return 0
  }

  let percentualMulta = CONSTANTS.MULTA_FGTS_DEMISSAO // 40% padrão

  // Acordo: 20%
  if (dados.tipoRescisao === 'acordo') {
    percentualMulta = CONSTANTS.MULTA_FGTS_ACORDO
  }

  // Saque-aniversário: reduz multa para 20%
  if (
    dados.saqueAniversario &&
    dados.tipoRescisao === 'demissao-sem-justa-causa'
  ) {
    percentualMulta = CONSTANTS.MULTA_FGTS_SAQUE_ANIVERSARIO
  }

  return dados.saldoFGTS * percentualMulta
}

/**
 * Exibe os resultados na interface
 */
function displayResults(verbas, periodo, dados) {
  // Mostra seção de resultados
  const resultSection = document.getElementById('resultado')
  resultSection.style.display = 'block'

  // Atualiza valores
  document.getElementById('valorTotal').textContent = formatMoney(verbas.total)
  document.getElementById('saldoSalario').textContent = formatMoney(
    verbas.saldoSalario,
  )
  document.getElementById('avisoPrevio').textContent = formatMoney(
    verbas.avisoPrevio,
  )
  document.getElementById('decimoTerceiro').textContent = formatMoney(
    verbas.decimoTerceiro,
  )
  document.getElementById('feriasVencidasValor').textContent = formatMoney(
    verbas.feriasVencidas,
  )
  document.getElementById('feriasProporcionais').textContent = formatMoney(
    verbas.feriasProporcionais,
  )
  document.getElementById('multaFGTS').textContent = formatMoney(
    verbas.multaFGTS,
  )

  // Atualiza período trabalhado
  const periodoTexto = `${periodo.anos} ano(s), ${periodo.meses} mês(es) e ${periodo.dias} dia(s)`
  document.getElementById('periodoTrabalhado').textContent = periodoTexto

  // Atualiza observações específicas do tipo de rescisão
  updateObservations(dados)

  // Scroll para o resultado
  resultSection.scrollIntoView({ behavior: 'smooth' })
}

/**
 * Atualiza observações baseadas no tipo de rescisão
 */
function updateObservations(dados) {
  const observacoesList = document.getElementById('observacoes')

  // Limpa observações anteriores
  observacoesList.textContent = ''

  // Função auxiliar para adicionar observações de forma segura
  const addObservation = (text) => {
    const li = document.createElement('li')
    li.textContent = text
    observacoesList.appendChild(li)
  }

  // Observações gerais
  addObservation('Os valores são brutos, antes dos descontos de INSS e IRRF')
  addObservation('FGTS será depositado na conta vinculada')

  // Observações específicas por tipo
  switch (dados.tipoRescisao) {
    case 'demissao-sem-justa-causa':
      addObservation('Direito ao seguro-desemprego')
      addObservation('Liberação total do FGTS + multa de 40%')
      if (dados.saqueAniversario) {
        addObservation(
          'Como optante do saque-aniversário, multa reduzida para 20%',
        )
      }
      break

    case 'demissao-justa-causa':
      addObservation('Sem direito ao seguro-desemprego')
      addObservation('Sem liberação do FGTS')
      addObservation(
        'Direito apenas ao saldo de salário e férias vencidas (se houver)',
      )
      break

    case 'pedido-demissao':
      addObservation('Sem direito ao seguro-desemprego')
      addObservation('Sem multa do FGTS')
      addObservation('FGTS permanece na conta vinculada')
      break

    case 'acordo':
      addObservation('Saque de até 80% do FGTS')
      addObservation('Multa reduzida para 20% do FGTS')
      addObservation('Sem direito ao seguro-desemprego')
      addObservation('Aviso prévio reduzido pela metade')
      break
  }

  // Observação sobre férias vencidas
  if (dados.feriasVencidas > 0) {
    addObservation(
      `Consideradas ${dados.feriasVencidas.toFixed(1)} período(s) de férias vencidas`,
    )
  }
}

/**
 * Utilitários para formatação e manipulação de dados
 */

// Converte valor monetário para float
function parseMoneyToFloat(moneyString) {
  if (!moneyString) return 0

  return (
    parseFloat(
      moneyString
        .replace(/R\$\s?/g, '')
        .replace(/\./g, '')
        .replace(',', '.'),
    ) || 0
  )
}

// Formata número para formato monetário brasileiro
const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatMoney(value) {
  return moneyFormatter.format(value)
}

// Formata data para input type="date"
function formatDateForInput(date) {
  return date.toISOString().split('T')[0]
}

// Atualiza data atual no cabeçalho
function updateCurrentDate() {
  const now = new Date()
  const dateString = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  document.getElementById('currentDate').textContent =
    `Atualizado em: ${dateString}`
}

// Define datas padrão nos inputs
function setDefaultDates() {
  const today = new Date()
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  const dataRescisaoInput = document.getElementById('dataRescisao')
  const dataAdmissaoInput = document.getElementById('dataAdmissao')

  if (!dataRescisaoInput.value) {
    dataRescisaoInput.value = formatDateForInput(today)
  }

  if (!dataAdmissaoInput.value) {
    dataAdmissaoInput.value = formatDateForInput(oneYearAgo)
  }
}

// Exportar funções para teste, se estiver em ambiente Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateSalaryBalance,
    calculatePriorNotice,
    calculateFGTSPenalty,
    calculateProportionalVacation,
    calculateVacationDue,
    calculateThirteenthSalary,
    CONSTANTS,
  }
}
