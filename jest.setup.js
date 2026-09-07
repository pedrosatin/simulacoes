if (typeof document !== 'undefined') {
  document.body.innerHTML = `
  <form id="simulationForm"></form>
  <input id="productValue">
  <input id="cashValue">
  <input id="installments">
  <div id="results"></div>
  <span id="selicRate"></span>
  <span id="selicDate"></span>
  <span id="cashPayment"></span>
  <span id="cashTotalCost"></span>
  <span id="installmentValue"></span>
  <span id="installmentTotal"></span>
  <span id="installmentTotalCost"></span>
  <span id="recommendationTitle"></span>
  <span id="recommendationText"></span>
  <span id="savingsLabel"></span>
  <span id="savingsValue"></span>
  <span id="savingsPercent"></span>
  <span id="monthlySelicRate"></span>
  <span id="investmentPeriod"></span>
  <span id="grossReturn"></span>
`
}
const utils = require('./js/utils.js')
global.applyMoneyMask = utils.applyMoneyMask
