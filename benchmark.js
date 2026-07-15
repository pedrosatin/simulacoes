const { performance } = require('perf_hooks');

// Mock DOM
global.document = {
  getElementById: (id) => {
    if (!global.elements[id]) {
      global.elements[id] = { value: '10', textContent: '', style: {}, addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } };
    }
    return global.elements[id];
  },
  querySelectorAll: (selector) => {
    return [{ dataset: { type: 'aumento' }, classList: { remove: () => {}, add: () => {} }, addEventListener: () => {}, getAttribute: () => 'tab1', value: '10', style: {} }];
  },
  querySelector: (selector) => {
    return { dataset: { type: 'aumento' }, classList: { remove: () => {}, add: () => {} }, addEventListener: () => {}, value: '10', style: {} };
  },
  addEventListener: () => {}
};
global.elements = {};

const RegraDeTresCalculadora = require('./regra-de-tres/regra-de-tres.js');

const calc = new RegraDeTresCalculadora();

// Benchmark calcularPorcentagem1
const iterations = 100000;
const start = performance.now();
for (let i = 0; i < iterations; i++) {
  calc.calcularPorcentagem1();
}
const end = performance.now();

console.log(`calcularPorcentagem1 benchmark: ${end - start} ms`);

// Benchmark calcularAumentoDesconto
const start2 = performance.now();
for (let i = 0; i < iterations; i++) {
  calc.calcularAumentoDesconto();
}
const end2 = performance.now();
console.log(`calcularAumentoDesconto benchmark: ${end2 - start2} ms`);

// Benchmark calcularProporcaoPorcentual
const start3 = performance.now();
for (let i = 0; i < iterations; i++) {
  calc.calcularProporcaoPorcentual();
}
const end3 = performance.now();
console.log(`calcularProporcaoPorcentual benchmark: ${end3 - start3} ms`);
