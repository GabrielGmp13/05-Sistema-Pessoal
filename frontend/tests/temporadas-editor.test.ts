import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../components/TemporadasAnimesEditor.tsx', import.meta.url), 'utf8');

test('edição conserva identidade e não regrava episódios ou metadados externos', () => {
  const trecho = source.slice(source.indexOf('async function salvarEdicao()'), source.indexOf('  return (', source.indexOf('async function salvarEdicao()')));
  assert.match(trecho, /atualizarTemporadaAnime\(editando/);
  assert.match(trecho, /item.uuid !== editando/);
  assert.match(trecho, /dadosEdicaoTemporada\(edicao\)/);
  assert.doesNotMatch(trecho, /anime_uuid:|anilist_id:|criarTemporadaAnime|apagarTemporadaAnime/);
});

test('remoção usa modal e alterações verificam resultado e sessão', () => {
  assert.match(source, /<ConfirmDialog/);
  assert.match(source, /if \(!await acao\(\)\)/);
  const helper = readFileSync(new URL('../lib/animes-temporadas.ts', import.meta.url), 'utf8');
  const atualizar = helper.slice(helper.indexOf('export async function atualizarTemporadaAnime'));
  assert.match(atualizar, /if \(!userId\) return null/);
  assert.match(atualizar, /\.eq\('user_id', userId\)/);
  assert.match(atualizar, /\.eq\('deleted', false\)/);
});

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
