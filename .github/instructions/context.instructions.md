---
applyTo: '**'
---

# Projeto: Simulação Financeira - À Vista vs Parcelado

## Descrição do Projeto

Este é um projeto web que simula a comparação entre comprar um produto à vista ou parcelado, considerando a taxa Selic atual e o rendimento que o dinheiro teria se investido.

## Funcionalidades Principais

### 1. Calculadora de Simulação

- **Input**: Valor do produto, valor à vista, quantidade de parcelas
- **Cálculo**: Comparar o custo real entre pagamento à vista vs parcelado
- **Consideração**: O dinheiro não gasto à vista renderá a taxa Selic no período das parcelas

### 2. Dados Dinâmicos

- **Taxa Selic**: Buscar automaticamente a taxa atual do Banco Central a cada acesso
- **API Sugerida**: Usar API do Banco Central do Brasil ou similar
- **Atualização**: Dados devem ser atualizados dinamicamente

### 3. Cálculos Financeiros

- **Valor Presente**: Calcular o valor presente das parcelas descontado pela taxa Selic
- **Custo de Oportunidade**: Comparar custo à vista vs valor presente do parcelamento
- **Metodologia**: Descontar cada parcela pela Selic considerando o mês de pagamento
- **Precisão**: Cálculos financeiros matematicamente corretos seguindo princípios de valor do dinheiro no tempo

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

## Diretrizes Técnicas

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

1. **Taxa Selic mensal**: Converter taxa anual para rendimento mensal usando juros compostos
2. **Valor presente das parcelas**: Descontar cada parcela pela Selic conforme mês de pagamento
3. **Comparação correta**: Valor à vista vs valor presente das parcelas
4. **Percentuais**: Exibir economia/prejuízo em valores absolutos e percentuais
5. **Formatação monetária**: Máscara brasileira com R$ e separadores corretos

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
