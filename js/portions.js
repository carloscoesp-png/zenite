// Porções caseiras sugeridas. A TACO não traz porções, então elas são definidas aqui
// por regras sobre o nome do alimento (sem acentos, minúsculo). Vale a primeira regra
// que combinar; sem regra, o app oferece 50, 100 e 200 g.
// Formato: [expressão regular, nome da porção, gramas]

export const PORTION_RULES = [
  // Cereais e derivados
  [/^arroz.*cozido|^arroz carreteiro|^baiao de dois/, 'colher de servir', 45],
  [/^macarrao, molho|^yakisoba|^vaca atolada|^virado/, 'prato raso', 200],
  [/^lasanha.*cozida|^nhoque/, 'prato raso', 150],
  [/^pao, trigo, frances|^pao, trigo, sovado/, 'unidade', 50],
  [/^pao, de queijo/, 'unidade média', 20],
  [/^pao, .*forma|^pao, de soja/, 'fatia', 25],
  [/^torrada/, 'unidade', 8],
  [/^biscoito, salgado, cream cracker/, 'unidade', 6],
  [/^biscoito, doce, maisena/, 'unidade', 5],
  [/^biscoito, doce/, 'unidade', 12],
  [/^biscoito, polvilho/, 'punhado', 15],
  [/^aveia|^farinha, lactea|^cereais, mistura|^creme de (arroz|milho)/, 'colher de sopa', 15],
  [/^cereais, milho, flocos|^cereal matinal/, 'xícara', 30],
  [/^bolo, pronto/, 'fatia', 60],
  [/^cuscuz/, 'fatia', 80],
  [/^tapioca, com manteiga/, 'unidade', 70],
  [/^farinha, de mandioca|^mandioca, farofa|^farinha, de milho/, 'colher de sopa', 16],
  [/^pipoca/, 'xícara', 10],
  [/^milho, verde/, 'colher de sopa', 25],
  [/^pamonha/, 'unidade', 150],
  [/^polenta/, 'fatia', 100],
  [/^pastel, .*frito/, 'unidade', 80],
  [/^canjica, com leite|^curau, milho verde$/, 'tigela pequena', 150],

  // Tubérculos e hortaliças
  [/^batata, inglesa, cozida/, 'unidade média', 130],
  [/^batata, inglesa, (frita|saute)|^mandioca, frita/, 'porção pequena', 100],
  [/^batata, frita, tipo chips/, 'pacote pequeno', 25],
  [/^batata, doce, cozida/, 'unidade média', 150],
  [/^batata, baroa, cozida|^inhame|^cara, cozido/, 'pedaço', 100],
  [/^mandioca, cozida/, 'pedaço', 100],
  [/^(alface|rucula|agriao|acelga|almeirao, cru|chicoria|catalonha, crua|mostarda|couve, manteiga, crua|espinafre.*cru)/, 'prato de sobremesa', 20],
  [/^tomate, com semente/, 'unidade média', 100],
  [/^tomate, salada|^salada/, 'colher de servir', 60],
  [/^tomate, (molho|pure)/, 'colher de sopa', 20],
  [/^tomate, extrato/, 'colher de sopa', 15],
  [/^cenoura, crua/, 'colher de sopa ralada', 12],
  [/^(brocolis|couve-flor)/, 'ramo', 30],
  [/^(cenoura, cozida|beterraba|chuchu|abobrinha|abobora|berinjela|vagem|couve, manteiga, refogada|repolho|quiabo|jilo|almeirao, refogado|espinafre.*refogado|catalonha, refogada)/, 'colher de sopa', 25],
  [/^pepino/, 'fatia', 10],
  [/^(cebola|pimentao|alho-poro)/, 'colher de sopa', 15],
  [/^alho, cru/, 'dente', 3],
  [/^palmito/, 'pedaço', 30],
  [/^seleta de legumes/, 'colher de sopa', 25],

  // Frutas
  [/^banana, prata/, 'unidade', 65],
  [/^banana, nanica/, 'unidade', 90],
  [/^banana, da terra/, 'unidade', 150],
  [/^banana, (maca|ouro|figo|pacova)/, 'unidade', 70],
  [/^maca, /, 'unidade', 130],
  [/^laranja, .*crua/, 'unidade', 140],
  [/suco concentrado/, 'copo (200 ml)', 200],
  [/, suco$/, 'copo (200 ml)', 200],
  [/^(tangerina|mexerica)/, 'unidade', 110],
  [/^mamao, papaia/, 'meia unidade', 150],
  [/^mamao, formosa/, 'fatia', 170],
  [/^manga, (haden|palmer|tommy)/, 'fatia', 80],
  [/^melancia/, 'fatia', 200],
  [/^melao/, 'fatia', 115],
  [/^abacaxi, cru/, 'fatia', 75],
  [/^uva, (italia|rubi)/, 'cacho pequeno', 100],
  [/^morango/, 'unidade', 12],
  [/^abacate/, 'colher de sopa', 30],
  [/^pera, /, 'unidade', 130],
  [/^kiwi/, 'unidade', 75],
  [/^goiaba, .*crua/, 'unidade', 170],
  [/^caqui/, 'unidade', 110],
  [/^acai, polpa, com xarope/, 'tigela (300 ml)', 300],
  [/polpa, congelada/, 'pacote de polpa', 100],
  [/^(goiaba, doce|marmelada|banana, doce em barra)/, 'pedaço', 40],

  // Gorduras
  [/^azeite|^oleo/, 'colher de sopa', 13],
  [/^manteiga|^margarina/, 'ponta de faca', 5],
  [/^maionese/, 'colher de sopa', 15],

  // Pescados
  [/^atum, conserva/, 'lata drenada', 120],
  [/^sardinha, conserva/, 'lata drenada', 84],
  [/^sardinha/, 'unidade', 40],
  [/^salmao.*grelhado/, 'posta', 120],
  [/^camarao|^bacalhau|^caranguejo/, 'porção', 100],
  [/^(abadejo|merluza|pescada|pintado|cacao|corvina|tucunare|salmao)/, 'filé', 120],

  // Carnes
  [/^carne, bovina, .*moido/, 'colher de servir', 50],
  [/^carne, bovina, almondegas/, 'unidade', 30],
  [/^carne, bovina/, 'bife médio', 100],
  [/^frango, peito|^frango, file/, 'filé médio', 100],
  [/^frango, coxa/, 'unidade', 70],
  [/^frango, sobrecoxa/, 'unidade', 90],
  [/^frango, asa/, 'unidade', 40],
  [/^hamburguer/, 'unidade', 90],
  [/^linguica/, 'gomo', 60],
  [/^(presunto|apresuntado|mortadela|salame)/, 'fatia', 15],
  [/^porco, bisteca/, 'unidade', 100],
  [/^porco, (lombo|pernil)/, 'fatia', 100],
  [/^coxinha/, 'unidade média', 80],
  [/^(empada|quibe)/, 'unidade', 80],
  [/^croquete/, 'unidade', 40],
  [/^estrogonofe|^salpicao|^feijao tropeiro/, 'colher de servir', 80],
  [/^feijoada/, 'concha', 150],
  [/^bife a cavalo/, 'unidade', 200],

  // Leite e derivados
  [/^iogurte/, 'pote', 170],
  [/^bebida lactea/, 'garrafinha', 180],
  [/^leite, fermentado/, 'frasco', 80],
  [/^leite, condensado/, 'colher de sopa', 20],
  [/^leite, de coco/, 'colher de sopa', 15],
  [/^leite, de vaca, .*po/, 'colher de sopa', 15],
  [/^leite/, 'copo (200 ml)', 200],
  [/^queijo, minas|^queijo, ricota/, 'fatia', 30],
  [/^queijo, parmesao/, 'colher de sopa (ralado)', 5],
  [/^queijo, requeijao/, 'colher de sopa', 30],
  [/^queijo, petit suisse/, 'pote', 45],
  [/^queijo/, 'fatia', 15],
  [/^creme de leite/, 'colher de sopa', 15],

  // Bebidas
  [/^cafe, infusao/, 'xícara (100 ml)', 100],
  [/^cha, /, 'xícara (200 ml)', 200],
  [/^refrigerante|^cerveja/, 'lata (350 ml)', 350],
  [/^bebida isotonica/, 'garrafa (500 ml)', 500],
  [/^coco, agua|^cana, caldo|^soja, extrato soluvel, natural/, 'copo (200 ml)', 200],
  [/^cana, aguardente/, 'dose', 50],

  // Ovos
  [/^ovo, de galinha, inteiro/, 'unidade', 50],
  [/^ovo, de galinha, clara/, 'unidade', 30],
  [/^ovo, de galinha, gema/, 'unidade', 17],
  [/^ovo, de codorna/, 'unidade', 10],
  [/^omelete/, 'unidade', 100],

  // Açúcares e doces
  [/^acucar/, 'colher de chá', 5],
  [/^mel|^melado/, 'colher de sopa', 20],
  [/^achocolatado|^capuccino/, 'colher de sopa', 15],
  [/^chocolate/, 'barra pequena', 25],
  [/^doce, de leite|^doce, de abobora/, 'colher de sopa', 20],
  [/^pacoca|^pe-de-moleque/, 'unidade', 20],
  [/^rapadura|^cocada|^maria mole|^quindim/, 'unidade', 30],

  // Leguminosas, nozes e outros
  [/^feijao, .*cozido|^lentilha, cozida/, 'concha média', 80],
  [/^ervilha, enlatada/, 'colher de sopa', 20],
  [/^soja, queijo/, 'fatia', 50],
  [/^amendoim|^castanha-de-caju|^amendoa/, 'punhado', 20],
  [/^castanha-do-brasil/, 'unidade', 4],
  [/^noz, /, 'unidade', 5],
  [/^(linhaca|gergelim)/, 'colher de sopa', 10],
  [/^coco, cru/, 'colher de sopa (ralado)', 10],
  [/^shoyu/, 'colher de sopa', 15],
  [/^azeitona/, 'unidade', 4],
  [/^acaraje/, 'unidade', 100],
];

export function portionFor(normalizedName) {
  const rule = PORTION_RULES.find(([re]) => re.test(normalizedName));
  return rule ? { portion: rule[1], portionG: rule[2] } : { portion: null, portionG: 100 };
}
