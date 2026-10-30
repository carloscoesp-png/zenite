# Zênite — MVP nutricional

Web app instalável (PWA) com contador nutricional, metas, hidratação e acompanhamento de peso.
Identidade: preto, dourado e branco, sempre em modo escuro. Interface em português, inglês e espanhol.
Sem dependências e sem etapa de build: HTML, CSS e JavaScript puro (módulos ES).
Os dados ficam no próprio aparelho (`localStorage`). Não há servidor nem login nesta fase.

## Como rodar

Na pasta do projeto:

```bash
python -m http.server 8765
```

Abra `http://localhost:8765`. Para testar no celular, ele precisa estar na mesma rede Wi-Fi:
use `http://<ip-do-computador>:8765`. A instalação na tela inicial exige HTTPS,
então para instalar de verdade é preciso publicar (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

## O que já funciona

- Cadastro com cálculo de metas (Mifflin-St Jeor × nível de atividade; −500 kcal para perder, +300 para ganhar).
- Registro de refeições por busca, com porções, favoritos, recentes e alimentos próprios (dados do rótulo).
- Calorias, proteínas, carboidratos e gorduras do dia; navegação por dias anteriores.
- Hidratação com meta de 35 ml por kg.
- **Dieta cumprida no dia**: calorias dentro de ±10% da meta (`DIET_TOLERANCE` em `js/calc.js`).
  Dia sem registro nunca conta como falha; dia neutro (descanso, doença, lesão) fica de fora.
- Peso, % de gordura e IMC, com gráfico por semana, mês, ano ou tudo.
- Calendário das últimas 4 semanas e gráfico de calorias dos últimos 14 dias.
- Exportar e importar cópia de segurança (JSON) e apagar todos os dados.
- Funciona sem internet depois do primeiro acesso (service worker).

## Jornada (Fase 2)

Regras em `RULES`, no topo de `js/journey.js`. Tudo é recalculado a partir do histórico de dias.

- **Missões do dia:** 3 automáticas de Constituição (registrar café, almoço e jantar; meta de água; ≥90% da meta de
  proteína) + 1 manual por área escolhida (Força, Agilidade, Sabedoria, Carisma). Manuais podem ser marcadas hoje e ontem.
- **Dia validado = +1 nível** (0 a 365): ≥50% das missões **e** dieta cumprida. Dia neutro não conta nem pune.
- **Atributos (-8 a 20):** +1 ponto a cada 13 dias ativos na área (Constituição: 2 das 3 automáticas).
  Usando o app 14 dias sem atividade numa área, ela perde 1 ponto. Dia sem nenhum registro não conta como falha.
- **XP:** 10 por missão automática, 20 por manual, 30 pela dieta cumprida.
- **Divisões:** Bronze → Prata → Ouro → Platina → Diamante → Mestre → Lenda; depois, uma estrela por ciclo.
  Renascer (no nível 365) sobe a Divisão e zera nível e atributos; histórico e dados de saúde ficam.
- Ranking por Divisão: depende de contas e servidor (próxima etapa).

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `js/i18n.js` | Textos da interface em pt-BR, en e es (`t('chave')`). Nomes de alimentos e porções ficam em português. |
| `js/store.js` | Estado e persistência. Cada dia guarda cópia das metas e dos nutrientes, para o histórico não mudar. |
| `js/calc.js` | Metas, IMC e status "dieta cumprida". |
| `js/journey.js` | Missões, nível, atributos, XP, Divisões e regras de balanceamento (`RULES`). |
| `js/taco.js` | TACO 4ª edição oficial (591 alimentos), gerada por `tools/convert_taco.py`. Não editar à mão. |
| `js/portions.js` | Porções caseiras por regra de nome (a TACO não traz porções). |
| `js/dishes.js` | Pratos e lanches prontos (prato feito, X-tudo, pizza, churrasco...) como receitas de ingredientes. |
| `js/foods.js` | Junta TACO, lista complementar, pratos prontos e alimentos do usuário; busca e ordenação. |
| `js/ui.js` | Formatação, datas e gráficos em SVG. |
| `js/views/*` | Telas: cadastro, hoje, adicionar, progresso, perfil. |
| `sw.js` | Cache offline (rede primeiro). Ao adicionar arquivos, inclua na lista e suba a versão. |

## Tabela de alimentos

Fonte: Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada,
NEPA/Unicamp, 2011 ([planilha oficial](https://nepa.unicamp.br/publicacoes/tabela-taco-excel/)).
Reprodução permitida com citação da fonte.

- Usa energia (kcal), proteína, carboidrato e lipídios por 100 g, sem alteração. Traços (Tr) e "NA" viram 0.
- Ficaram de fora 6 itens sem análise na TACO ("*"): leite de vaca integral e desnatado UHT, iogurte de abacaxi,
  coco verde e dois tipos de sal.
- Correção: o item 540 aparece como "L" na planilha; o nome certo é "Feijoada".
- Lista complementar em `js/foods.js` (identificada no app como "valor médio de rótulo"): leite integral,
  semidesnatado e desnatado, macarrão cozido, pão de forma tradicional, goma de tapioca, whey, refrigerante zero,
  pão de hambúrguer, salsicha e massa de pizza.
- Pratos prontos em `js/dishes.js` (identificados como "prato montado"): cada um é uma receita padrão e os valores
  são a soma dos ingredientes. O app mostra a lista de ingredientes de cada prato.

Para regenerar a partir da planilha (precisa de `openpyxl`):

```bash
python tools/convert_taco.py Taco-4a-Edicao.xlsx js/taco.js nomes.txt
```

## Antes de lançar

- Revisar as porções caseiras em `js/portions.js` com um nutricionista. 148 alimentos ainda não têm porção (o app oferece 50, 100 e 200 g).
- Revisar os valores da lista complementar com rótulos reais.
- Medidas corporais (cintura, quadril etc.) e receitas ainda não foram feitas.
- Revisar textos de privacidade (LGPD) antes de qualquer versão com servidor.
