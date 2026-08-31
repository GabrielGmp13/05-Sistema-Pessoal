import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../components/TemporadasAnimesEditor.tsx', import.meta.url), 'utf8');

test('seleção, nota e confirmação precedem as temporadas cadastradas', () => {
  const inicio = source.indexOf('<section className={styles.adicaoTemporada}');
  const fim = source.indexOf('</section>', inicio);
  const grupo = source.slice(inicio, fim);
  assert.ok(inicio > 0 && fim > inicio);
  assert.ok(grupo.includes('styles.obraSelecionada'));
  assert.ok(grupo.includes('Minha nota nesta temporada'));
  assert.ok(grupo.includes('Adicionar temporada selecionada'));
  assert.ok(grupo.includes('Escolher outra temporada'));
  assert.ok(source.indexOf('Temporadas adicionadas') > fim);
});

test('busca digitada e relações são alternativas e desaparecem após selecionar', () => {
  assert.match(source, /!relacaoSelecionada \? <>/);
  assert.match(source, /buscaObra\.trim\(\)\.length >= 2 \? <BuscaMetadados[^\n]+: anilistId \?/);
  assert.match(source, /key=\{`busca:\$\{buscaObra\.trim\(\)\}`\}/);
});

test('trocar seleção invalida enriquecimento anterior e mantém a nota digitada durante a espera', () => {
  assert.match(source, /if \(versao !== versaoSelecao\.current\) return/);
  assert.match(source, /function trocarObra\(\) \{\s*versaoSelecao\.current \+= 1/);
  assert.match(source, /minha_nota: atual\.minha_nota/);
  assert.match(source, /disabled=\{salvando \|\| completando \|\| carregando\}/);
});
