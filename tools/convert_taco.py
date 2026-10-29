"""Converte a planilha oficial TACO 4a edição (NEPA/Unicamp) em js/taco.js.

Uso: python -I convert_taco.py <Taco-4a-Edicao.xlsx> <saida taco.js> <lista de nomes.txt>
Mantém os valores oficiais por 100 g: energia (kcal), proteína, lipídios e carboidrato.
'Tr' (traços) vira 0; 'NA' (não aplicável) e vazio viram 0 e são contados no relatório.
"""
import json
import re
import sys

import openpyxl

src, out_js, out_names = sys.argv[1:4]
wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
ws = wb.worksheets[0]  # "CMVCol taco3": composição centesimal

COL_ID, COL_NAME, COL_KCAL, COL_PROT, COL_FAT, COL_CARB = 0, 1, 3, 5, 6, 8

stats = {'tr': 0, 'na': 0}


def value(v):
    if isinstance(v, (int, float)):
        return round(float(v), 1)
    s = str(v or '').strip()
    if s.lower() == 'tr':
        stats['tr'] += 1
        return 0.0
    stats['na'] += 1
    return 0.0


# Erros de digitação da planilha (conferidos com a versão em PDF da TACO).
NAME_FIXES = {540: 'Feijoada'}

foods, category = [], None
for row in ws.iter_rows(values_only=True):
    first, name = row[0], row[1]
    if isinstance(first, str) and first.strip() and name is None and all(c is None for c in row[2:12]):
        category = first.strip()
        continue
    if not isinstance(first, (int, float)) or not name:
        continue
    kcal = row[COL_KCAL]
    if not isinstance(kcal, (int, float)):
        print('sem energia, ignorado:', int(first), name)
        continue
    clean = ' '.join(str(name).split())
    clean = re.sub(r'\s\d$', '', clean)  # números de nota de rodapé ("Cerveja, pilsen 2")
    clean = NAME_FIXES.get(int(first), clean)
    foods.append([
        int(first),
        clean,
        category,
        round(float(kcal)),
        value(row[COL_PROT]),
        value(row[COL_CARB]),
        value(row[COL_FAT]),
    ])

ids = [f[0] for f in foods]
assert len(ids) == len(set(ids)), 'números repetidos'
categories = list(dict.fromkeys(f[2] for f in foods))

lines = [
    '// Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada.',
    '// NEPA/Unicamp, 2011. Fonte: https://nepa.unicamp.br/publicacoes/tabela-taco-excel/',
    '// Reprodução permitida com citação da fonte. Gerado automaticamente a partir da planilha oficial;',
    '// não editar à mão. Valores por 100 g de parte comestível.',
    "// Traços (Tr) e 'não aplicável' (NA) estão como 0.",
    '// Formato: [número TACO, descrição, índice da categoria, kcal, proteína g, carboidrato g, lipídios g]',
    '',
    f'export const TACO_CATEGORIES = {json.dumps(categories, ensure_ascii=False)};',
    '',
    'export const TACO = [',
]
for f in foods:
    lines.append('  ' + json.dumps([f[0], f[1], categories.index(f[2]), *f[3:]], ensure_ascii=False) + ',')
lines.append('];')
lines.append('')

with open(out_js, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write('\n'.join(lines))
with open(out_names, 'w', encoding='utf-8') as fh:
    for f in foods:
        fh.write(f'{f[0]}\t{f[1]}\t{f[2]}\t{f[3]}\n')

print('alimentos:', len(foods), '| categorias:', len(categories), '| Tr->0:', stats['tr'], '| NA->0:', stats['na'])
print('categorias:', categories)
