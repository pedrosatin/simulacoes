---
applyTo: '**'
---

# Projeto: Simulações Financeiras

## Descrição do Projeto

Este é um projeto web que oferece calculadoras financeiras para auxiliar em decisões econômicas pessoais. O projeto inclui três principais ferramentas:

1. **Calculadora À Vista vs Parcelado**: Simula a comparação entre comprar um produto à vista ou parcelado, considerando a taxa Selic atual
2. **Calculadora de Salário Líquido**: Calcula o salário líquido considerando descontos obrigatórios (INSS, IRRF) e opcionais
3. **Calculadora de Rescisão Trabalhista**: Calcula o valor das verbas rescisórias para todos os tipos de rescisão trabalhista

## Funcionalidades Principais

### 1. Calculadora À Vista vs Parcelado

- **Input**: Valor do produto, valor à vista, quantidade de parcelas
- **Cálculo**: Comparar o custo real entre pagamento à vista vs parcelado
- **Consideração**: O dinheiro não gasto à vista renderá a taxa Selic no período das parcelas

### 2. Calculadora de Salário Líquido

- **Input**: Salário bruto, dependentes, descontos opcionais
- **Cálculo**: Desconto progressivo de INSS e IRRF conforme tabelas oficiais 2025
- **Consideração**: Aplicação correta das alíquotas por faixas salariais
- **Descontos opcionais**: Plano de saúde, vale refeição, vale transporte, outros

### 3. Calculadora de Rescisão Trabalhista

- **Input**: Salário mensal, datas de admissão e rescisão, tipo de rescisão, informações adicionais
- **Tipos de rescisão**: Demissão sem/com justa causa, pedido de demissão, acordo (Reforma Trabalhista)
- **Verbas calculadas**: Saldo de salário, aviso prévio, 13º salário, férias vencidas/proporcionais, multa FGTS
- **Funcionalidades especiais**: Saque-aniversário FGTS, aviso prévio trabalhado, validação de datas
- **Cálculos específicos**: Aviso prévio progressivo (30 dias + 3 por ano), férias proporcionais, multas diferenciadas

### 4. Dados Dinâmicos

- **Taxa Selic**: Buscar automaticamente a taxa atual do Banco Central a cada acesso
- **API Sugerida**: Usar API do Banco Central do Brasil ou similar
- **Atualização**: Dados devem ser atualizados dinamicamente
- **Tabelas tributárias**: INSS e IRRF atualizadas para 2025

### 5. Cálculos Financeiros

- **Valor Presente**: Calcular o valor presente das parcelas descontado pela taxa Selic
- **Custo de Oportunidade**: Comparar custo à vista vs valor presente do parcelamento
- **Metodologia**: Descontar cada parcela pela Selic considerando o mês de pagamento
- **Precisão**: Cálculos financeiros matematicamente corretos seguindo princípios de valor do dinheiro no tempo
- **Tributação progressiva**: Aplicação correta das alíquotas de INSS e IRRF por faixas

## Diretrizes de Design

### Visual e UX

- **Tema**: Dark mode obrigatório
- **Referência**: Seguir o design de satinp.dev.br
- **Responsividade**: Deve funcionar perfeitamente como iframe
- **Cores**: Usar paleta escura consistente com o site principal

### Layout

- **Interface limpa**: Foco na funcionalidade sem distrações
- **Inputs intuitivos**: Campos com máscara monetária brasileira (R$ 1.234,56)
- **Formatação automática**: Aplicação de formatação em tempo real nos valores
- **Resultados visuais**: Comparações visuais claras entre as opções
- **Validação visual**: Indicadores visuais de erro nos campos
- **Mobile-first**: Funcionar bem em dispositivos móveis
- **Navegação unificada**: Header com navegação entre as calculadoras
- **Cards informativos**: Resumo das regras tributárias nas páginas relevantes

## Diretrizes Técnicas

### Estrutura de Arquivos

```
simulacoes/
├── index.html           # Página principal da calculadora À Vista vs Parcelado
├── salario.html         # Página da calculadora de Salário Líquido
├── rescisao.html        # Página da calculadora de Rescisão Trabalhista
├── styles.css           # Estilos CSS com tema dark (compartilhado)
├── script.js           # Lógica JavaScript da calculadora À Vista vs Parcelado
├── salario.js          # Lógica JavaScript da calculadora de Salário Líquido
├── rescisao.js         # Lógica JavaScript da calculadora de Rescisão Trabalhista
├── favicon.svg         # Ícone escalável da aplicação
├── manifest.json       # Configuração PWA
├── sitemap.xml         # Mapa do site para SEO (inclui todas as páginas)
├── robots.txt          # Instruções para crawlers
├── RESCISAO.md         # Documentação específica da calculadora de rescisão
└── .github/
    └── instructions/
        └── context.instructions.md
```

### Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (vanilla ou framework leve)
- **APIs**: Integração com API do Banco Central para taxa Selic
- **Performance**: Carregamento rápido para uso em iframe

### Estrutura de Código

- **Modular**: Separar lógica de cálculo, UI e API calls
- **Comentários**: Documentar especialmente os cálculos financeiros
- **Validação**: Validar inputs do usuário com máscara monetária
- **Error Handling**: Tratar erros de API e inputs inválidos
- **Formatação**: Implementar máscara monetária em tempo real

### Cálculos Específicos

#### Calculadora À Vista vs Parcelado

1. **Taxa Selic mensal**: Converter taxa anual para rendimento mensal usando juros compostos
2. **Valor presente das parcelas**: Descontar cada parcela pela Selic conforme mês de pagamento
3. **Comparação correta**: Valor à vista vs valor presente das parcelas
4. **Percentuais**: Exibir economia/prejuízo em valores absolutos e percentuais
5. **Formatação monetária**: Máscara brasileira com R$ e separadores corretos

#### Calculadora de Salário Líquido

1. **INSS progressivo**: Aplicação correta das alíquotas por faixas (7,5% a 14%)
2. **IRRF progressivo**: Cálculo com deduções por faixa e dependentes
3. **Base de cálculo IRRF**: Salário bruto - INSS - dependentes - outras deduções
4. **Dependentes**: R$ 189,59 de dedução por dependente
5. **Descontos opcionais**: Vale transporte (máximo 6%), plano de saúde, outros

## Integração com satinp.dev.br

- **Iframe**: O projeto será incorporado como iframe
- **Dimensões**: Considerar tamanhos responsivos
- **Comunicação**: Se necessário, implementar postMessage para comunicação com o site pai
- **Performance**: Otimizar para carregamento em iframe

## Metodologia de Cálculo

### Princípio Fundamental

A comparação deve ser feita entre:

- **À vista**: Valor pago imediatamente
- **Parcelado**: Valor presente das parcelas futuras descontadas pela taxa Selic

### Fórmula do Valor Presente

Para cada parcela i (de 1 a n):

```
VP_parcela_i = Valor_Parcela / (1 + taxa_mensal_selic)^i
VP_total = Soma de todas as VP_parcela_i
```

### Comparação Final

- Se VP*total < Valor*à_vista → Parcelado é melhor
- Se VP*total > Valor*à_vista → À vista é melhor

### Exemplo Prático

- Produto: R$ 1.000 parcelado ou R$ 990 à vista
- Selic: 15% a.a. (≈ 1,17% a.m.)
- 12 parcelas de R$ 83,33
- VP das parcelas ≈ R$ 938
- Resultado: Parcelar é R$ 52 melhor que à vista

#### Calculadora de Rescisão Trabalhista

1. **Saldo de salário**: Dias trabalhados no mês da rescisão ÷ 30 × salário
2. **Aviso prévio**: 30 dias base + 3 dias por ano trabalhado (máximo 90 dias)
3. **13º salário**: Proporcional aos meses trabalhados no ano (≥15 dias = mês completo)
4. **Férias vencidas**: Períodos não gozados × salário × 1,33
5. **Férias proporcionais**: Meses desde último aniversário × salário ÷ 12 × 1,33
6. **Multa FGTS**: 40% (demissão), 20% (acordo/saque-aniversário), 0% (justa causa/pedido)

### Regras Específicas por Tipo de Rescisão

- **Demissão sem justa causa**: Todas as verbas + seguro-desemprego
- **Demissão por justa causa**: Apenas saldo + férias vencidas (se houver)
- **Pedido de demissão**: Sem multa FGTS, sem seguro-desemprego
- **Acordo (Reforma Trabalhista)**: 50% aviso prévio, 20% multa FGTS, 80% saque FGTS

## Fontes de Dados

- **API Banco Central**: https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json (Meta Selic COPOM)
- **Backup**: Implementar fallback caso a API esteja indisponível
- **Cache**: Considerar cache local para evitar múltiplas chamadas desnecessárias
- **Tratamento de datas**: API retorna datas em formato brasileiro (dd/mm/aaaa)

## Diretrizes de Código

- **Clean Code**: Código limpo e legível
- **Comentários em Português**: Documentação em português brasileiro
- **Validação robusta**: Validar todos os inputs financeiros
- **Precisão decimal**: Usar bibliotecas adequadas para cálculos financeiros precisos

## SEO e Otimizações Web

### Meta Tags e Estrutura

- **Title otimizado**: "Calculadora Financeira: À Vista vs Parcelado com Taxa Selic - Simulação Gratuita"
- **Meta description**: Descrição clara e atrativa com palavras-chave relevantes
- **Keywords**: calculadora financeira, à vista vs parcelado, taxa selic, simulação financeira, etc.
- **Open Graph**: Meta tags para compartilhamento em redes sociais
- **Twitter Cards**: Otimização para compartilhamento no Twitter
- **Canonical URL**: https://satinp.github.io/simulacoes/

#### Página de Salário Líquido

- **Title**: "Calculadora de Salário Líquido 2025 - Desconto INSS e IRRF"
- **Keywords**: calculadora salário líquido, INSS, IRRF, desconto folha pagamento, tabela imposto renda 2025
- **Canonical URL**: https://satinp.github.io/simulacoes/salario.html

### Estrutura Semântica

- **HTML5 semântico**: Uso correto de header, main, section, footer
- **Headings hierárquicos**: H1, H2, H3 organizados logicamente
- **Schema.org**: JSON-LD com dados estruturados da aplicação web
- **Lang attribute**: pt-BR para indicar idioma português brasileiro
- **Alt texts**: Textos alternativos em imagens (quando aplicável)

### Favicon e Identidade Visual

- **Favicon SVG**: Ícone escalável de calculadora com tema dark
- **Apple touch icon**: Compatibilidade com dispositivos iOS
- **Theme color**: #1a1a2e para consistência visual
- **Manifest.json**: Configuração PWA com metadados da aplicação

### Arquivos de SEO

- **sitemap.xml**: Mapeamento de URLs para motores de busca (inclui todas as páginas)
- **robots.txt**: Instruções para crawlers com referência ao sitemap
- **manifest.json**: Configuração de Progressive Web App

### Conteúdo Otimizado

- **Texto descritivo**: Explicações claras sobre funcionamento da calculadora
- **Palavras-chave naturais**: Integração orgânica de termos relevantes
- **Conteúdo educativo**: Seções explicativas sobre metodologia e benefícios
- **Call-to-actions**: Textos direcionais claros e objetivos

### Performance e Acessibilidade

- **Loading rápido**: Otimização para carregamento em iframe
- **Mobile-first**: Responsividade completa para dispositivos móveis
- **Contraste adequado**: Cores que garantem legibilidade
- **Navigation**: Estrutura clara e intuitiva

### Palavras-chave Alvo

#### Primárias

- calculadora financeira
- à vista vs parcelado
- taxa selic
- simulação financeira
- valor presente
- calculadora salário líquido
- INSS
- IRRF
- calculadora rescisão trabalhista
- demissão sem justa causa
- aviso prévio
- verbas rescisórias

#### Secundárias

- investimento vs parcelamento
- custo de oportunidade
- decisão financeira
- economia doméstica
- planejamento financeiro
- calculadora selic
- comparar formas de pagamento
- desconto folha pagamento
- salário bruto líquido
- tabela imposto renda 2025
- 13º salário proporcional
- férias vencidas
- FGTS multa
- acordo trabalhista
- reforma trabalhista

#### Long-tail

- "calcular se vale a pena parcelar ou pagar à vista"
- "simulador financeiro com taxa selic"
- "qual melhor forma de pagamento considerando selic"
- "calculadora online gratuita valor presente"
- "calcular salário líquido com INSS e IRRF"
- "quanto desconta de INSS do meu salário"
- "tabela imposto de renda 2025 salário"
- "calcular rescisão trabalhista demissão sem justa causa"
- "valor verbas rescisórias aviso prévio 13º férias"
- "calculadora FGTS multa rescisão trabalhista"
- "acordo rescisão trabalhista reforma trabalhista"

### Estratégia de Conteúdo

- **Conteúdo educativo**: Explicar conceitos financeiros de forma acessível
- **Exemplos práticos**: Cases reais de uso da calculadora
- **Benefícios claros**: Destacar vantagens de usar a ferramenta
- **Metodologia transparente**: Explicar como os cálculos são realizados
- **Atualizações**: Manter dados da Selic sempre atualizados

### Implementação SEO Realizada

#### Meta Tags Implementadas

```html
<!-- SEO básico -->
<title>
  Calculadora Financeira: À Vista vs Parcelado com Taxa Selic - Simulação
  Gratuita
</title>
<meta
  name="description"
  content="Calculadora online gratuita para comparar pagamento à vista vs parcelado considerando a taxa Selic atual..."
/>
<meta
  name="keywords"
  content="calculadora financeira, à vista vs parcelado, taxa selic..."
/>

<!-- Open Graph para redes sociais -->
<meta
  property="og:title"
  content="Calculadora Financeira: À Vista vs Parcelado com Taxa Selic"
/>
<meta property="og:description" content="Calculadora online gratuita..." />
<meta property="og:url" content="https://satinp.github.io/simulacoes/" />

<!-- Twitter Cards -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:title" content="Calculadora Financeira..." />
```

#### Dados Estruturados (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Calculadora Financeira: À Vista vs Parcelado",
  "description": "Calculadora online gratuita...",
  "applicationCategory": "FinanceApplication"
}
```

#### Arquivos SEO Criados

- **sitemap.xml**: Mapa do site com URL principal e frequência de atualização
- **robots.txt**: Permite indexação e referencia o sitemap
- **manifest.json**: Configuração PWA com metadados da aplicação
- **favicon.svg**: Ícone otimizado com tema da calculadora

#### Otimizações de Conteúdo

- **Headings semânticos**: H1 principal, H2 e H3 organizados hierarquicamente
- **Conteúdo descritivo**: Seções explicativas sobre metodologia e benefícios
- **Palavras-chave naturais**: Integração orgânica nos textos
- **Alt texts**: Implementados para elementos visuais
- **Estrutura HTML5**: Tags semânticas (header, main, section, footer)

## Calculadora de Salário Líquido - Especificações Técnicas

### Tabelas Tributárias 2025

#### INSS (Previdência Social)

- **Faixa 1**: Até R$ 1.412,00 - Alíquota 7,5%
- **Faixa 2**: De R$ 1.412,01 a R$ 2.666,68 - Alíquota 9%
- **Faixa 3**: De R$ 2.666,69 a R$ 4.000,03 - Alíquota 12%
- **Faixa 4**: De R$ 4.000,04 a R$ 7.786,02 - Alíquota 14%
- **Teto**: R$ 7.786,02 (contribuição máxima R$ 1.090,04)

#### IRRF (Imposto de Renda Retido na Fonte)

- **Faixa 1**: Até R$ 2.259,20 - Isento
- **Faixa 2**: De R$ 2.259,21 a R$ 2.826,65 - Alíquota 7,5% (dedução R$ 169,44)
- **Faixa 3**: De R$ 2.826,66 a R$ 3.751,05 - Alíquota 15% (dedução R$ 381,44)
- **Faixa 4**: De R$ 3.751,06 a R$ 4.664,68 - Alíquota 22,5% (dedução R$ 662,77)
- **Faixa 5**: Acima de R$ 4.664,68 - Alíquota 27,5% (dedução R$ 896,00)

### Deduções e Descontos

#### Dependentes

- **Valor por dependente**: R$ 189,59
- **Aplicação**: Deduzido da base de cálculo do IRRF
- **Limite**: Sem limite máximo de dependentes

#### Descontos Opcionais

- **Plano de Saúde**: Valor integral deduzido da base do IRRF
- **Vale Transporte**: Máximo 6% do salário bruto
- **Vale Refeição**: Conforme valor informado
- **Outros Descontos**: Adiantamentos, empréstimos, etc.

### Metodologia de Cálculo

#### Ordem de Cálculo

1. **INSS**: Calculado progressivamente sobre o salário bruto
2. **Base IRRF**: Salário bruto - INSS - dependentes - plano de saúde
3. **IRRF**: Calculado progressivamente sobre a base de cálculo
4. **Salário Líquido**: Salário bruto - INSS - IRRF - descontos opcionais

#### Validações Implementadas

- **Salário mínimo**: Validação de valores mínimos
- **Vale transporte**: Limitado a 6% do salário bruto
- **Campos obrigatórios**: Salário bruto é obrigatório
- **Formatos monetários**: Máscara automática R$ 0.000,00

### Interface e UX

#### Elementos Visuais

- **Cards informativos**: Resumo das regras de INSS e IRRF
- **Breakdown detalhado**: Separação clara de cada desconto
- **Tabelas de referência**: Faixas tributárias 2025 visíveis
- **Cores semânticas**: Verde para líquido, azul para bruto, vermelho para descontos

#### Responsividade

- **Mobile-first**: Otimizado para dispositivos móveis
- **Grid adaptável**: Layout flexível para diferentes telas
- **Navegação touch**: Botões e campos otimizados para toque

## Calculadora de Rescisão Trabalhista - Especificações Técnicas

### Regras de Cálculo Implementadas

#### Tipos de Rescisão Suportados

1. **Demissão sem Justa Causa**

   - Todas as verbas rescisórias
   - Multa de 40% sobre FGTS (ou 20% se saque-aniversário)
   - Direito ao seguro-desemprego

2. **Demissão por Justa Causa**

   - Apenas saldo de salário e férias vencidas
   - Sem multa do FGTS, sem seguro-desemprego

3. **Pedido de Demissão**

   - Todas as verbas exceto multa do FGTS
   - Sem seguro-desemprego

4. **Acordo (Reforma Trabalhista)**
   - 50% do aviso prévio
   - Multa de 20% sobre FGTS
   - Saque de até 80% do FGTS

#### Cálculos Específicos

- **Aviso Prévio**: 30 dias + 3 dias por ano trabalhado (máx. 90 dias)
- **13º Salário**: Proporcional aos meses trabalhados (≥15 dias = mês completo)
- **Férias Proporcionais**: Desde último aniversário + 1/3 constitucional
- **Saldo de Salário**: Dias trabalhados no mês ÷ 30 × salário

#### Validações e Recursos

- **Validação de datas**: Impede inconsistências temporais
- **Saque-aniversário**: Reduz multa FGTS de 40% para 20%
- **Aviso trabalhado**: Desconta dias trabalhados do total
- **Formatação monetária**: Máscara brasileira automática
- **Responsividade**: Interface adaptada para mobile e desktop

#### Interface Específica

- **Cards informativos**: Explicação dos tipos de rescisão
- **Formulário estruturado**: Informações básicas e adicionais separadas
- **Breakdown detalhado**: Cada verba calculada separadamente
- **Informações legais**: Grid com regras por tipo de rescisão
- **Validação em tempo real**: Feedback imediato para o usuário
