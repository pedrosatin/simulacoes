# 🧮 Simulações Financeiras

Suite completa de calculadoras financeiras online gratuitas para auxiliar em decisões financeiras inteligentes.

## 📁 Estrutura do Projeto

```
simulacoes/
├── assets/
│   └── global.css              # Estilos globais compartilhados
├── a-vista-vs-parcelado/
│   ├── index.html             # Calculadora À Vista vs Parcelado
│   ├── a-vista-vs-parcelado.css # Estilos específicos
│   └── a-vista-vs-parcelado.js  # Lógica de cálculo
├── salario-liquido/
│   ├── index.html             # Calculadora de Salário Líquido
│   ├── salario-liquido.css    # Estilos específicos
│   └── salario-liquido.js     # Lógica de cálculo
├── rescisao-trabalhista/
│   ├── index.html             # Calculadora de Rescisão Trabalhista
│   ├── rescisao-trabalhista.css # Estilos específicos
│   └── rescisao-trabalhista.js  # Lógica de cálculo
├── index.html                 # Página inicial
├── manifest.json              # PWA manifest
├── sitemap.xml               # Sitemap para SEO
├── robots.txt                # Robots.txt para SEO
├── favicon.svg               # Favicon
└── README.md                 # Este arquivo
```

## 🚀 Calculadoras Disponíveis

### 💰 À Vista vs Parcelado

- **URL**: `/a-vista-vs-parcelado/`
- **Descrição**: Compare qual opção é mais vantajosa financeiramente
- **Recursos**:
  - Taxa Selic em tempo real
  - Cálculo de valor presente
  - Recomendação inteligente
  - Simulação detalhada

### 💸 Salário Líquido

- **URL**: `/salario-liquido/`
- **Descrição**: Calcule seu salário líquido com todos os descontos
- **Recursos**:
  - Cálculo preciso de INSS
  - Imposto de Renda detalhado
  - Descontos opcionais
  - Tabelas atualizadas para 2025

### 📋 Rescisão Trabalhista

- **URL**: `/rescisao-trabalhista/`
- **Descrição**: Calcule valores de rescisão para todos os tipos de demissão
- **Recursos**:
  - Todos os tipos de demissão
  - Aviso prévio completo
  - 13º e férias proporcionais
  - FGTS e multa rescisória

## 🎨 Arquitetura CSS

### Abordagem Modular

O projeto utiliza uma arquitetura CSS modular com:

- **`assets/global.css`**: Estilos base, componentes reutilizáveis, navegação, formulários, botões e responsividade
- **`[calculadora]/[calculadora].css`**: Estilos específicos para cada calculadora

### Benefícios

- ✅ **Manutenibilidade**: Cada calculadora tem seus próprios estilos
- ✅ **Performance**: Carregamento otimizado de CSS
- ✅ **Escalabilidade**: Fácil adição de novas calculadoras
- ✅ **Organização**: Código bem estruturado e documentado

## 🔧 Tecnologias

- **HTML5**: Estrutura semântica
- **CSS3**: Design responsivo e moderno
- **JavaScript**: Cálculos e interações
- **PWA**: Progressive Web App
- **SEO**: Otimizado para motores de busca

## 📱 Responsividade

Todas as calculadoras são totalmente responsivas e otimizadas para:

- 📱 **Mobile**: 320px+
- 📱 **Tablet**: 768px+
- 💻 **Desktop**: 1024px+

## 🛠️ Desenvolvimento

### Estrutura de Arquivos

Cada calculadora segue o padrão:

```
calculadora-nome/
├── index.html              # Interface principal
├── calculadora-nome.css    # Estilos específicos
└── calculadora-nome.js     # Lógica de cálculo
```

### Adicionando Nova Calculadora

1. Criar pasta com nome da calculadora
2. Criar `index.html` com estrutura base
3. Criar CSS específico seguindo padrões
4. Implementar lógica JavaScript
5. Atualizar navegação e sitemap

## 📈 SEO e Performance

- ✅ **Sitemap XML** atualizado
- ✅ **Meta tags** otimizadas
- ✅ **Schema.org** structured data
- ✅ **Open Graph** tags
- ✅ **Favicon** SVG
- ✅ **PWA** manifest

## 🎯 Objetivos

Estas calculadoras são ferramentas **educativas** desenvolvidas para:

- Auxiliar em decisões financeiras
- Demonstrar cálculos baseados em legislação brasileira
- Promover educação financeira
- Fornecer simulações precisas e atualizadas

## ⚠️ Aviso Legal

Estas são ferramentas educativas para auxiliar em decisões financeiras. Os resultados são baseados em cálculos matemáticos e legislação vigente. Para decisões importantes, consulte sempre um profissional qualificado.

## 🔗 Links

- **Site**: [https://satinp.github.io/simulacoes/](https://satinp.github.io/simulacoes/)
- **GitHub**: [https://github.com/satinP/simulacoes](https://github.com/satinP/simulacoes)

---

Desenvolvido com ❤️ para promover educação financeira no Brasil.
