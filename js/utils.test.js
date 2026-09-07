/**
 * @jest-environment jsdom
 */
const {
  formatCurrency,
  formatNumber,
  parseLocaleNumber,
  applyMoneyMask,
} = require('./utils.js')

// O Intl separa o simbolo do valor com espaco nao-quebravel
const NBSP = ' '

describe('formatCurrency', () => {
  it('should format values as Brazilian currency', () => {
    expect(formatCurrency(0)).toBe(`R$${NBSP}0,00`)
    expect(formatCurrency(1234.5)).toBe(`R$${NBSP}1.234,50`)
    expect(formatCurrency(1234567.89)).toBe(`R$${NBSP}1.234.567,89`)
  })

  it('should format negative values', () => {
    expect(formatCurrency(-1234.56)).toBe(`-R$${NBSP}1.234,56`)
  })

  it('should round to two decimal places', () => {
    expect(formatCurrency(0.005)).toBe(`R$${NBSP}0,01`)
    expect(formatCurrency(1.004)).toBe(`R$${NBSP}1,00`)
  })

  it('should return a dash for non-finite values', () => {
    expect(formatCurrency(Infinity)).toBe('—')
    expect(formatCurrency(-Infinity)).toBe('—')
    expect(formatCurrency(NaN)).toBe('—')
  })
})

describe('formatNumber', () => {
  it('should format with two decimals by default', () => {
    expect(formatNumber(1234.5)).toBe('1.234,50')
    expect(formatNumber(0)).toBe('0,00')
  })

  it('should honour the requested number of decimals', () => {
    expect(formatNumber(1234.5678, 0)).toBe('1.235')
    expect(formatNumber(1234.5678, 4)).toBe('1.234,5678')
  })

  it('should reuse the cached formatter across calls', () => {
    expect(formatNumber(1, 3)).toBe('1,000')
    expect(formatNumber(2, 3)).toBe('2,000')
  })

  it('should return a dash for non-finite values', () => {
    expect(formatNumber(Infinity)).toBe('—')
    expect(formatNumber(NaN)).toBe('—')
  })
})

describe('parseLocaleNumber', () => {
  it('should parse plain decimal strings', () => {
    expect(parseLocaleNumber('1234,56')).toBe(1234.56)
    expect(parseLocaleNumber('0,01')).toBe(0.01)
  })

  it('should treat the dot as a thousands separator', () => {
    expect(parseLocaleNumber('1.234,56')).toBe(1234.56)
    expect(parseLocaleNumber('1.234.567,89')).toBe(1234567.89)
  })

  it('should strip the currency symbol and whitespace', () => {
    expect(parseLocaleNumber('R$ 1.234,56')).toBe(1234.56)
    expect(parseLocaleNumber(`R$${NBSP}1.234,56`)).toBe(1234.56)
    expect(parseLocaleNumber('  1234,56  ')).toBe(1234.56)
    expect(parseLocaleNumber(' 1 2 3 , 4 5 ')).toBe(123.45)
  })

  it('should parse negative values', () => {
    expect(parseLocaleNumber('-1234,56')).toBe(-1234.56)
    expect(parseLocaleNumber('-R$ 0,50')).toBe(-0.5)
  })

  it('should keep only the first comma of a malformed string', () => {
    expect(parseLocaleNumber('1.234,56,78')).toBe(1234.56)
  })

  it('should pass finite numbers through untouched', () => {
    expect(parseLocaleNumber(1234.56)).toBe(1234.56)
    expect(parseLocaleNumber(0)).toBe(0)
    expect(parseLocaleNumber(-7)).toBe(-7)
  })

  it('should coerce anything unparseable to 0', () => {
    expect(parseLocaleNumber('')).toBe(0)
    expect(parseLocaleNumber('   ')).toBe(0)
    expect(parseLocaleNumber('R$ abc')).toBe(0)
    expect(parseLocaleNumber(null)).toBe(0)
    expect(parseLocaleNumber(undefined)).toBe(0)
    expect(parseLocaleNumber({})).toBe(0)
    expect(parseLocaleNumber(NaN)).toBe(0)
    expect(parseLocaleNumber(Infinity)).toBe(0)
  })
})

describe('applyMoneyMask', () => {
  function inputWith(value) {
    const input = document.createElement('input')
    input.value = value
    return input
  }

  it('should clear the input when there is no digit', () => {
    const input = inputWith('')
    expect(applyMoneyMask(input)).toBe(0)
    expect(input.value).toBe('')

    const letters = inputWith('abc')
    expect(applyMoneyMask(letters)).toBe(0)
    expect(letters.value).toBe('')
  })

  it('should read the digits typed as cents', () => {
    const one = inputWith('1')
    expect(applyMoneyMask(one)).toBe(0.01)
    expect(one.value).toBe(`R$${NBSP}0,01`)

    const two = inputWith('12')
    expect(applyMoneyMask(two)).toBe(0.12)
    expect(two.value).toBe(`R$${NBSP}0,12`)

    const five = inputWith('12345')
    expect(applyMoneyMask(five)).toBe(123.45)
    expect(five.value).toBe(`R$${NBSP}123,45`)
  })

  it('should add thousands separators for long values', () => {
    const input = inputWith('123456789')
    expect(applyMoneyMask(input)).toBe(1234567.89)
    expect(input.value).toBe(`R$${NBSP}1.234.567,89`)
  })

  it('should ignore leading zeros', () => {
    const input = inputWith('000012345')
    expect(applyMoneyMask(input)).toBe(123.45)
    expect(input.value).toBe(`R$${NBSP}123,45`)
  })

  it('should be idempotent when re-applied to an already masked value', () => {
    const input = inputWith('12345')
    applyMoneyMask(input)
    const value = input.value

    applyMoneyMask(input)
    expect(input.value).toBe(value)
  })

  it('should mask a pasted formatted value', () => {
    const input = inputWith('R$ 1.234,56')
    expect(applyMoneyMask(input)).toBe(1234.56)
    expect(input.value).toBe(`R$${NBSP}1.234,56`)
  })
})
