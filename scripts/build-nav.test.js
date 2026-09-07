/**
 * @jest-environment node
 */
const { ROUTES, START, END, renderNav, stitch } = require('./build-nav.js')

describe('renderNav', () => {
  it('should render one link per route, in order', () => {
    const nav = renderNav('salario-liquido')

    for (const { dir, label } of ROUTES) {
      expect(nav).toContain(`href="../${dir}/"`)
      expect(nav).toContain(`>${label}</a>`)
    }

    const order = ROUTES.map(({ dir }) => nav.indexOf(`href="../${dir}/"`))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('should mark exactly the current page as active', () => {
    for (const { dir } of ROUTES) {
      const nav = renderNav(dir)
      expect(nav.match(/nav-link active/g)).toHaveLength(1)
      expect(nav).toContain(`href="../${dir}/" class="nav-link active"`)
    }
  })

  it('should mark nothing as active for an unknown page', () => {
    expect(renderNav('nao-existe')).not.toContain('active')
  })
})

describe('stitch', () => {
  const page = `<body>\n      ${START}\n      ${END}\n    </body>`

  it('should insert the nav between the markers', () => {
    const result = stitch(page, 'regra-de-tres')

    expect(result).toContain('<nav class="navigation">')
    expect(result).toContain('href="../regra-de-tres/" class="nav-link active"')
    expect(result.startsWith('<body>')).toBe(true)
    expect(result.endsWith('</body>')).toBe(true)
  })

  it('should replace the previous nav instead of stacking a second one', () => {
    const once = stitch(page, 'regra-de-tres')
    const twice = stitch(once, 'regra-de-tres')

    expect(twice).toBe(once)
    expect(twice.match(/<nav class="navigation">/g)).toHaveLength(1)
  })

  it('should switch the active link when the page changes', () => {
    const result = stitch(stitch(page, 'regra-de-tres'), 'juros-compostos')

    expect(result).toContain(
      'href="../juros-compostos/" class="nav-link active"',
    )
    expect(result).toContain('href="../regra-de-tres/" class="nav-link"')
  })

  it('should refuse a page without the markers', () => {
    expect(() => stitch('<body></body>', 'regra-de-tres')).toThrow(/marcadores/)
  })

  it('should refuse markers that are out of order', () => {
    expect(() => stitch(`${END}\n${START}`, 'regra-de-tres')).toThrow(
      /fora de ordem/,
    )
  })
})
