#!/usr/bin/env node
/**
 * Fonte única da navegação do site.
 *
 * O site é estático e não tem bundler, mas o `<nav>` era copiado literalmente
 * nas 5 páginas — adicionar uma calculadora ou reordenar o menu exigia editar
 * 5 arquivos e manter a classe `active` sincronizada na mão.
 *
 * Este script gera o markup a partir de ROUTES e o costura entre os marcadores
 * `nav:start` / `nav:end` de cada página. O HTML publicado continua 100%
 * estático: a navegação não depende de JavaScript no browser, o que importa
 * para indexação e para quem navega sem JS.
 *
 *   node scripts/build-nav.js           # reescreve as páginas
 *   node scripts/build-nav.js --check   # falha se alguma estiver dessincronizada
 */
const fs = require('node:fs')
const path = require('node:path')

const ROUTES = [
  { dir: 'a-vista-vs-parcelado', label: 'À Vista vs Parcelado' },
  { dir: 'salario-liquido', label: 'Salário Líquido' },
  { dir: 'rescisao-trabalhista', label: 'Rescisão Trabalhista' },
  { dir: 'regra-de-tres', label: 'Regra de Três' },
  { dir: 'juros-compostos', label: 'Juros Compostos' },
]

const START = '<!-- nav:start (gerado por scripts/build-nav.js) -->'
const END = '<!-- nav:end -->'
const INDENT = '      '

/** Markup do `<nav>` para a página de `currentDir`, com a indentação da página. */
function renderNav(currentDir) {
  const items = ROUTES.map(({ dir, label }) => {
    const classes = dir === currentDir ? 'nav-link active' : 'nav-link'
    return `  <li><a href="../${dir}/" class="${classes}">${label}</a></li>`
  })

  return [
    '<nav class="navigation">',
    '  <div class="nav-brand">',
    '    <a href="../" class="nav-home">🏠 Início</a>',
    '    <span class="nav-title">Simulações Online</span>',
    '  </div>',
    '  <ul class="nav-menu">',
    ...items.map((line) => `  ${line}`),
    '  </ul>',
    '</nav>',
  ]
    .map((line) => (line ? INDENT + line : line))
    .join('\n')
}

/** Substitui o bloco entre os marcadores. Lança se a página não os tiver. */
function stitch(html, currentDir) {
  const start = html.indexOf(START)
  const end = html.indexOf(END)

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `marcadores "nav:start"/"nav:end" ausentes ou fora de ordem em ${currentDir}/index.html`,
    )
  }

  const before = html.slice(0, start)
  const after = html.slice(end + END.length)
  return `${before}${START}\n${renderNav(currentDir)}\n${INDENT}${END}${after}`
}

function main() {
  const check = process.argv.includes('--check')
  const root = path.join(__dirname, '..')
  const stale = []

  for (const { dir } of ROUTES) {
    const file = path.join(root, dir, 'index.html')
    const current = fs.readFileSync(file, 'utf8')
    const next = stitch(current, dir)

    if (current === next) continue

    if (check) {
      stale.push(`${dir}/index.html`)
    } else {
      fs.writeFileSync(file, next)
      console.log(`atualizado: ${dir}/index.html`)
    }
  }

  if (stale.length > 0) {
    console.error(
      'Navegação dessincronizada em:\n' +
        stale.map((f) => `  - ${f}`).join('\n') +
        '\n\nRode `npm run build:nav` e commite o resultado.',
    )
    process.exit(1)
  }

  console.log(check ? 'Navegação sincronizada.' : 'Navegação gerada.')
}

if (require.main === module) {
  main()
}

module.exports = { ROUTES, START, END, renderNav, stitch }
