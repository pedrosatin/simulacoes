const { JSDOM } = require('jsdom')

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <!-- Tabs -->
  <button class="tab-button active" data-tab="tab1"></button>
  <button class="tab-button" data-tab="tab2"></button>
  <div class="tab-content active" id="tab1"></div>
  <div class="tab-content" id="tab2"></div>

  <!-- Regra de Três -->
  <input type="text" id="valorA" class="input-number" value="10">
  <input type="text" id="valorB" class="input-number" value="20">
  <input type="text" id="valorC" class="input-number" value="30">
  <input type="text" id="valorX" class="input-number">

  <!-- Porcentagem 1 -->
  <input type="text" id="percentual1" class="input-number" value="15">
  <input type="text" id="valor1" class="input-number" value="200">
  <span id="resultado1"></span>

  <!-- Aumento / Desconto -->
  <input type="text" id="valorBase" class="input-number" value="100">
  <input type="text" id="percentualMudanca" class="input-number" value="10">
  <button class="toggle-btn active" data-type="aumento"></button>
  <button class="toggle-btn" data-type="desconto"></button>
  <span id="valorOriginal"></span>
  <span id="tipoMudanca"></span>
  <span id="valorMudanca"></span>
  <span id="valorFinal"></span>

  <!-- Que % é de -->
  <input type="text" id="valorParte" class="input-number" value="25">
  <input type="text" id="valorTotal" class="input-number" value="200">
  <span id="resultadoPorcentagem"></span>
  <span id="explicacaoCalculo"></span>
</body>
</html>
`)

global.document = dom.window.document
global.window = dom.window
global.navigator = dom.window.navigator

const RegraDeTresCalculadora = require('./regra-de-tres.js')
const calc = new RegraDeTresCalculadora()

const iterations = 10000

const start = process.hrtime.bigint()
for (let i = 0; i < iterations; i++) {
  calc.calcularPorcentagem1()
}
const end = process.hrtime.bigint()

const durationMs = Number(end - start) / 1000000
console.log(
  `calcularPorcentagem1: ${iterations} iterations took ${durationMs.toFixed(2)} ms`,
)
