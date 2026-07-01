const test = require('node:test');
const assert = require('node:assert');
const RegraDeTresCalculadora = require('./regra-de-tres');

test('RegraDeTresCalculadora - calcularValorDaPorcentagem', async (t) => {
  // Use Object.create to avoid calling constructor which has DOM dependencies in this.init()
  const calc = Object.create(RegraDeTresCalculadora.prototype);

  await t.test('calcula corretamente porcentagens normais', () => {
    assert.strictEqual(calc.calcularValorDaPorcentagem(10, 100), 10);
    assert.strictEqual(calc.calcularValorDaPorcentagem(50, 200), 100);
    assert.strictEqual(calc.calcularValorDaPorcentagem(100, 50), 50);
  });

  await t.test('lida com zero corretamente', () => {
    assert.strictEqual(calc.calcularValorDaPorcentagem(0, 100), 0);
    assert.strictEqual(calc.calcularValorDaPorcentagem(10, 0), 0);
    assert.strictEqual(calc.calcularValorDaPorcentagem(0, 0), 0);
  });

  await t.test('lida com decimais corretamente', () => {
    assert.strictEqual(calc.calcularValorDaPorcentagem(5.5, 200), 11);
    // Para lidar com imprecisão de ponto flutuante em JS, vamos checar com precisão até um limite
    const resultado = calc.calcularValorDaPorcentagem(10, 25.5);
    assert.ok(Math.abs(resultado - 2.55) < 0.0001, `Expected ~2.55, got ${resultado}`);
  });

  await t.test('lida com números grandes', () => {
    assert.strictEqual(calc.calcularValorDaPorcentagem(15, 1000000), 150000);
  });

  await t.test('lida com valores maiores que 100%', () => {
    assert.strictEqual(calc.calcularValorDaPorcentagem(150, 200), 300);
  });
});
