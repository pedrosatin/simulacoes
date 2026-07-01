const { test } = require('node:test')
const assert = require('node:assert')
const { calculatePriorNotice, CONSTANTS } = require('./rescisao-trabalhista.js')

test('calculatePriorNotice', async (t) => {
  const salario = 3000
  const valorDia = salario / CONSTANTS.DIAS_MES // 100

  await t.test('Justa causa não tem direito a aviso prévio', () => {
    const dados = { tipoRescisao: 'demissao-justa-causa', salario }
    const periodo = { anos: 2 }
    assert.strictEqual(calculatePriorNotice(dados, periodo), 0)
  })

  await t.test('Pedido de demissão sem cumprir aviso retorna 0', () => {
    const dados = { tipoRescisao: 'pedido-demissao', diasAviso: 0, salario }
    const periodo = { anos: 2 }
    assert.strictEqual(calculatePriorNotice(dados, periodo), 0)
  })

  await t.test('Demissão sem justa causa - base de 30 dias', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', diasAviso: 0, salario }
    const periodo = { anos: 0 } // Menos de 1 ano completo
    const expected = valorDia * 30 // 30 dias
    assert.strictEqual(calculatePriorNotice(dados, periodo), expected)
  })

  await t.test('Demissão sem justa causa - adicional por ano trabalhado', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', diasAviso: 0, salario }
    const periodo = { anos: 3 } // 3 anos completos = 30 + 3*3 = 39 dias
    const expected = valorDia * 39
    assert.strictEqual(calculatePriorNotice(dados, periodo), expected)
  })

  await t.test('Demissão sem justa causa - limite máximo de 90 dias', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', diasAviso: 0, salario }
    const periodo = { anos: 25 } // 30 + 25*3 = 105 dias, deve limitar em 90
    const expected = valorDia * 90
    assert.strictEqual(calculatePriorNotice(dados, periodo), expected)
  })

  await t.test('Desconta dias de aviso já trabalhados', () => {
    const dados = { tipoRescisao: 'demissao-sem-justa-causa', diasAviso: 15, salario }
    const periodo = { anos: 2 } // 30 + 2*3 = 36 dias, desconta 15 = 21 dias a pagar
    const expected = valorDia * 21
    assert.strictEqual(calculatePriorNotice(dados, periodo), expected)
  })

  await t.test('Acordo reduz pela metade', () => {
    const dados = { tipoRescisao: 'acordo', diasAviso: 0, salario }
    const periodo = { anos: 4 } // 30 + 4*3 = 42 dias, metade = 21 dias
    const expected = valorDia * 21
    assert.strictEqual(calculatePriorNotice(dados, periodo), expected)
  })

  await t.test('Acordo reduz pela metade com dias já trabalhados', () => {
    const dados = { tipoRescisao: 'acordo', diasAviso: 10, salario }
    const periodo = { anos: 4 } // 30 + 4*3 = 42 dias. Desconta 10 = 32 dias. Acordo (metade) = 16 dias.
    const expected = valorDia * 16
    assert.strictEqual(calculatePriorNotice(dados, periodo), expected)
  })
})
