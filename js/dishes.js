// Pratos e lanches prontos que a TACO não traz (prato feito, X-tudo, pizza...).
// Cada um é uma receita padrão: os valores nutricionais vêm da soma dos ingredientes
// (TACO ou lista complementar). Receitas reais variam; a lista de ingredientes aparece no app.
//
// portion: nome de uma unidade do prato (a soma das gramas dos ingredientes)
// extra:   atalhos em múltiplos da unidade, ex. ['pizza grande (8 fatias)', 8]
// keywords: termos extras de busca

const SALADA = [['taco-78', 15], ['taco-157', 40]];

const pizza = (id, name, toppings, keywords = '') => ({
  id, name, portion: 'fatia', keywords: `pizza ${keywords}`,
  extra: [['2 fatias', 2], ['pizza grande (8 fatias)', 8]],
  items: [['rot-massa-pizza', 55], ['taco-159', 10], ...toppings],
});

export const DISHES = [
  // Café da manhã e comidas básicas
  { id: 'pao-ovo', name: 'Pão com ovo', portion: 'unidade', keywords: 'pao frances ovo frito cafe da manha',
    items: [['taco-53', 50], ['taco-490', 50]] },
  { id: 'pao-manteiga', name: 'Pão com manteiga', portion: 'unidade', keywords: 'pao na chapa frances cafe da manha',
    items: [['taco-53', 50], ['taco-261', 5]] },
  { id: 'pao-queijo-fatia', name: 'Pão com queijo', portion: 'unidade', keywords: 'pao frances mussarela cafe da manha',
    items: [['taco-53', 50], ['taco-463', 20]] },
  { id: 'misto-frio', name: 'Misto frio (pão com presunto e queijo)', portion: 'unidade',
    keywords: 'misto pao frances presunto queijo cafe da manha',
    items: [['taco-53', 50], ['taco-439', 15], ['taco-463', 15]] },
  { id: 'pao-mortadela', name: 'Pão com mortadela', portion: 'unidade', keywords: 'pao frances lanche',
    items: [['taco-53', 50], ['taco-424', 30]] },
  { id: 'pao-requeijao', name: 'Pão com requeijão', portion: 'unidade', keywords: 'pao frances cafe da manha',
    items: [['taco-53', 50], ['taco-468', 20]] },
  { id: 'torrada-requeijao', name: 'Torradas com requeijão (2 unidades)', portion: 'porção', keywords: 'cafe da manha',
    items: [['taco-63', 16], ['taco-468', 20]] },
  { id: 'ovos-mexidos', name: 'Ovos mexidos (2 ovos)', portion: 'porção', keywords: 'ovo mexido cafe da manha',
    items: [['taco-489', 100], ['taco-261', 5]] },
  { id: 'tapioca-ovo', name: 'Tapioca com ovo', portion: 'unidade', keywords: 'cafe da manha',
    items: [['rot-tapioca-goma', 60], ['taco-490', 50]] },
  { id: 'cuscuz-ovo', name: 'Cuscuz com ovo', portion: 'prato', keywords: 'cuscuz nordestino cafe da manha',
    items: [['taco-533', 120], ['taco-490', 50]] },
  { id: 'cuscuz-manteiga', name: 'Cuscuz com manteiga', portion: 'prato', keywords: 'cuscuz nordestino cafe da manha',
    items: [['taco-533', 120], ['taco-261', 5]] },
  { id: 'cafe-leite', name: 'Café com leite', portion: 'xícara (200 ml)', keywords: 'pingado cafe da manha',
    items: [['taco-471', 100], ['rot-leite-integral', 100]] },
  { id: 'cafe-leite-acucar', name: 'Café com leite e açúcar', portion: 'xícara (200 ml)', keywords: 'pingado adocado cafe da manha',
    items: [['taco-471', 100], ['rot-leite-integral', 100], ['taco-494', 10]] },
  { id: 'cafe-acucar', name: 'Cafezinho com açúcar', portion: 'xícara (50 ml)', keywords: 'cafe adocado',
    items: [['taco-471', 50], ['taco-494', 5]] },
  { id: 'vitamina-banana', name: 'Vitamina de banana com aveia', portion: 'copo (300 ml)', keywords: 'batida leite cafe da manha',
    items: [['rot-leite-integral', 200], ['taco-182', 65], ['taco-7', 15]] },
  { id: 'mingau-aveia', name: 'Mingau de aveia', portion: 'tigela', keywords: 'papa aveia leite cafe da manha',
    items: [['rot-leite-integral', 200], ['taco-7', 30], ['taco-494', 10]] },
  { id: 'banana-aveia', name: 'Banana com aveia', portion: 'porção', keywords: 'lanche',
    items: [['taco-182', 65], ['taco-7', 15]] },
  { id: 'sanduiche-atum', name: 'Sanduíche de atum', portion: 'unidade', keywords: 'lanche pao de forma',
    items: [['rot-pao-forma', 50], ['taco-277', 40], ['taco-524', 10]] },

  // Almoço e jantar do dia a dia
  { id: 'arroz-feijao', name: 'Arroz com feijão', portion: 'prato', keywords: 'arroz e feijao almoco',
    items: [['taco-3', 100], ['taco-561', 80]] },
  { id: 'bife-acebolado', name: 'Bife acebolado', portion: 'bife', keywords: 'carne cebola almoco',
    items: [['taco-346', 100], ['taco-107', 30], ['taco-272', 5]] },
  { id: 'frango-salada', name: 'Frango grelhado com salada', portion: 'prato', keywords: 'dieta almoco',
    items: [['taco-410', 120], ['taco-78', 30], ['taco-157', 50], ['taco-260', 5]] },
  { id: 'salada-simples', name: 'Salada de alface e tomate com azeite', portion: 'prato', keywords: 'salada verde',
    items: [['taco-78', 30], ['taco-157', 50], ['taco-260', 5]] },
  { id: 'macarrao-alho-oleo', name: 'Macarrão alho e óleo', portion: 'prato', keywords: 'massa espaguete',
    items: [['rot-macarrao-cozido', 150], ['taco-260', 10], ['taco-82', 3]] },
  { id: 'macarrao-molho', name: 'Macarrão ao molho de tomate', portion: 'prato', keywords: 'massa espaguete sugo',
    items: [['rot-macarrao-cozido', 150], ['taco-159', 60], ['taco-464', 5]] },

  // Pratos feitos
  {
    id: 'pf-bife', name: 'Prato feito com bife', portion: 'prato', keywords: 'pf comercial executivo almoco',
    items: [['taco-3', 150], ['taco-561', 100], ['taco-346', 100], ['taco-93', 60], ...SALADA],
  },
  {
    id: 'pf-frango', name: 'Prato feito com frango grelhado', portion: 'prato', keywords: 'pf comercial executivo almoco',
    items: [['taco-3', 150], ['taco-561', 100], ['taco-410', 120], ['taco-93', 60], ...SALADA],
  },
  {
    id: 'pf-ovo', name: 'Prato feito com ovo frito', portion: 'prato', keywords: 'pf comercial almoco',
    items: [['taco-3', 150], ['taco-561', 100], ['taco-490', 100], ['taco-131', 20], ...SALADA],
  },
  {
    id: 'marmita-fit', name: 'Marmita fit (frango, arroz integral, batata-doce e brócolis)', portion: 'marmita',
    keywords: 'fitness dieta',
    items: [['taco-1', 100], ['taco-410', 120], ['taco-88', 100], ['taco-100', 80]],
  },
  {
    id: 'churrasco', name: 'Prato de churrasco', portion: 'prato', keywords: 'churrascaria rodizio',
    items: [['taco-381', 150], ['taco-423', 60], ['taco-395', 40], ['taco-131', 30], ['taco-157', 40], ['taco-107', 15], ['taco-3', 100]],
  },
  { id: 'espeto-carne', name: 'Espetinho de carne', portion: 'unidade', keywords: 'churrasco espeto', items: [['taco-370', 100]] },
  { id: 'espeto-frango', name: 'Espetinho de frango', portion: 'unidade', keywords: 'churrasco espeto', items: [['taco-410', 90]] },
  { id: 'espeto-coracao', name: 'Espetinho de coração de frango', portion: 'unidade', keywords: 'churrasco espeto', items: [['taco-395', 60]] },
  {
    id: 'lasanha', name: 'Lasanha à bolonhesa', portion: 'pedaço', keywords: 'massa',
    items: [['rot-macarrao-cozido', 100], ['taco-326', 60], ['taco-159', 60], ['taco-463', 30], ['taco-439', 20]],
  },

  // Lanches
  {
    id: 'x-burger', name: 'X-burger', portion: 'unidade', keywords: 'xburger hamburguer lanche',
    items: [['rot-pao-hamburguer', 50], ['taco-417', 90], ['taco-463', 20]],
  },
  {
    id: 'x-salada', name: 'X-salada', portion: 'unidade', keywords: 'xsalada hamburguer lanche',
    items: [['rot-pao-hamburguer', 50], ['taco-417', 90], ['taco-463', 20], ['taco-78', 10], ['taco-157', 30], ['taco-524', 10]],
  },
  {
    id: 'x-bacon', name: 'X-bacon', portion: 'unidade', keywords: 'xbacon hamburguer lanche',
    items: [['rot-pao-hamburguer', 50], ['taco-417', 90], ['taco-463', 20], ['taco-445', 20], ['taco-524', 10]],
  },
  {
    id: 'x-egg', name: 'X-egg', portion: 'unidade', keywords: 'xegg hamburguer lanche ovo',
    items: [['rot-pao-hamburguer', 50], ['taco-417', 90], ['taco-463', 20], ['taco-490', 50]],
  },
  {
    id: 'x-tudo', name: 'X-tudo', portion: 'unidade', keywords: 'xtudo completo hamburguer lanche',
    items: [
      ['rot-pao-hamburguer', 60], ['taco-417', 90], ['taco-463', 30], ['taco-439', 20], ['taco-490', 50], ['taco-445', 20],
      ['taco-78', 10], ['taco-157', 30], ['taco-45', 20], ['taco-90', 10], ['taco-524', 15],
    ],
  },
  {
    id: 'cachorro-quente', name: 'Cachorro-quente', portion: 'unidade', keywords: 'hot dog dogao lanche',
    items: [['rot-pao-hamburguer', 50], ['rot-salsicha', 50], ['taco-159', 30], ['taco-45', 15], ['taco-90', 10]],
  },
  {
    id: 'misto-quente', name: 'Misto-quente', portion: 'unidade', keywords: 'lanche sanduiche',
    items: [['rot-pao-forma', 50], ['taco-439', 20], ['taco-463', 20], ['taco-261', 5]],
  },
  {
    id: 'sanduiche-natural', name: 'Sanduíche natural de frango', portion: 'unidade', keywords: 'lanche',
    items: [['taco-52', 50], ['taco-404', 40], ['taco-468', 15], ['taco-78', 10], ['taco-157', 20], ['taco-110', 10]],
  },

  // Salgados
  { id: 'enrolado-salsicha', name: 'Enrolado de salsicha (assado)', portion: 'unidade', keywords: 'enroladinho salgado',
    items: [['rot-massa-pizza', 50], ['rot-salsicha', 30]] },
  { id: 'enrolado-presunto-queijo', name: 'Enrolado de presunto e queijo (assado)', portion: 'unidade', keywords: 'enroladinho salgado',
    items: [['rot-massa-pizza', 50], ['taco-439', 15], ['taco-463', 15]] },
  { id: 'esfiha-carne', name: 'Esfiha de carne', portion: 'unidade', keywords: 'esfirra salgado',
    items: [['rot-massa-pizza', 45], ['taco-326', 30], ['taco-107', 5], ['taco-157', 10]] },
  { id: 'tapioca-queijo', name: 'Tapioca de queijo', portion: 'unidade', keywords: '',
    items: [['rot-tapioca-goma', 60], ['taco-463', 30]] },
  { id: 'tapioca-frango', name: 'Tapioca de frango com requeijão', portion: 'unidade', keywords: 'catupiry',
    items: [['rot-tapioca-goma', 60], ['taco-404', 40], ['taco-468', 20]] },

  // Pizzas (uma fatia de pizza grande)
  pizza('pizza-mucarela', 'Pizza de muçarela', [['taco-463', 35], ['taco-260', 2]], 'mussarela mucarela queijo'),
  pizza('pizza-calabresa', 'Pizza de calabresa', [['taco-463', 20], ['taco-423', 25], ['taco-107', 10]]),
  pizza('pizza-portuguesa', 'Pizza portuguesa',
    [['taco-463', 25], ['taco-439', 15], ['taco-488', 10], ['taco-107', 8], ['taco-521', 4], ['taco-560', 5]]),
  pizza('pizza-frango-catupiry', 'Pizza de frango com catupiry', [['taco-404', 25], ['taco-468', 20], ['taco-463', 15]], 'requeijao'),
  pizza('pizza-marguerita', 'Pizza marguerita', [['taco-463', 30], ['taco-157', 20], ['taco-133', 1], ['taco-260', 2]], 'margherita'),
];
