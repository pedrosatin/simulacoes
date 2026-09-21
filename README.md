# Simulações

A collection of free, static financial calculators built with plain HTML, CSS, and JavaScript, no framework, no backend. Each calculator lives in its own folder and runs entirely in the browser.

Live site: https://pedrosatin.github.io/simulacoes/

## Calculators

- **Rescisão Trabalhista** (`rescisao-trabalhista/`): estimates termination pay for a Brazilian employee dismissed without just cause, covering notice period, proportional vacation with the one-third bonus, 13th salary, and FGTS penalty.
- **Salário Líquido** (`salario-liquido/`): computes net salary from gross pay, applying INSS and progressive IRRF deductions.
- **Regra de Três** (`regra-de-tres/`): a simple/compound rule-of-three (cross-multiplication) calculator for proportions and percentages.
- **Juros Compostos** (`juros-compostos/`): projects compound interest and investment growth over time, with optional monthly contributions.
- **À Vista vs Parcelado** (`a-vista-vs-parcelado/`): compares paying in cash versus in installments, using the current Selic rate as the opportunity-cost benchmark.

## Stack

- Vanilla HTML/CSS/JS (`type: commonjs`, no build step for the site itself)
- Jest + jest-environment-jsdom for unit tests
- oxlint for linting, oxfmt for formatting
- Node.js 24 (see `.nvmrc`)
- GitHub Actions for CI (tests, lint, format check, nav check) and deployment to GitHub Pages

Shared logic (currency formatting, parsing, masking, and DOM helpers) lives in `js/utils.js` and is imported by each calculator. The navigation shared across all five pages is generated from a single source by `scripts/build-nav.js`.

## Running locally

```bash
npm install
```

Then serve the repo root with any static file server (for example `npx serve .`) and open `index.html` in the browser. There's no dev server or bundler, just static files.

## Scripts

```bash
npm test              # run the Jest test suite
npm run lint           # lint with oxlint
npm run lint:fix       # lint and auto-fix
npm run format          # format JS/CSS with oxfmt
npm run format:check    # check formatting without writing
npm run build:nav       # regenerate the shared nav from scripts/build-nav.js
npm run check:nav       # verify the nav is in sync (used in CI)
```

## Deployment

Pushes to `master` trigger a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs tests, lint, and format checks, then publishes the site to GitHub Pages. Only the production files (HTML, CSS, JS, and static assets) are copied into the published directory; test files, configs, and dev-only artifacts are excluded.

## License

MIT. See [LICENSE](LICENSE).
