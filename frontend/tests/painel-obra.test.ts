import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { organizarCampos, percentualProgresso, urlExterna, dataPainel, historicoObra, NOMES_MIDIA } from '../components/painel-obra-dados.ts';

test('painéis cobrem as nove mídias sem tipos fictícios', () => {
  assert.equal(Object.keys(NOMES_MIDIA).length, 9);
  assert.equal(NOMES_MIDIA.playlist, 'Playlist');
});
test('campos vazios não criam seções e textos longos ficam separados dos metadados', () => {
  const dados = organizarCampos([{ label: 'Sinopse', valor: 'Texto longo' }, { label: 'Nota', valor: '0 / 5' },
    { label: 'Direção', valor: 'Pessoa' }, { label: 'Comentário', valor: '  ' }, { label: 'Autor', valor: '' },
    { label: 'Capítulo atual', valor: '0' }]);
  assert.equal(dados.sinopse, 'Texto longo');
  assert.equal(dados.comentario, undefined);
  assert.deepEqual(dados.cabecalho, [{ label: 'Nota', valor: '0 / 5' }]);
  assert.deepEqual(dados.equipe, [{ label: 'Direção', valor: 'Pessoa' }]);
  assert.deepEqual(dados.detalhes, [{ label: 'Capítulo atual', valor: '0' }]);
  assert.deepEqual(organizarCampos([]).historico, []);
});
test('progresso distingue zero de total desconhecido e limita valores inválidos', () => {
  assert.equal(percentualProgresso(0, 100), 0);
  assert.equal(percentualProgresso(50, 100), 50);
  assert.equal(percentualProgresso(200, 100), 100);
  assert.equal(percentualProgresso(-2, 100), 0);
  assert.equal(percentualProgresso(50, 0), null);
  assert.equal(percentualProgresso(50, null), null);
  assert.equal(percentualProgresso(null, 100), null);
  assert.equal(percentualProgresso(NaN, 100), null);
});
test('links externos não aceitam protocolos executáveis ou valores incompletos', () => {
  for (const url of ['', 'javascript:alert(1)', 'data:text/html,a', '//example.com', 'x']) assert.equal(urlExterna(url), undefined);
  assert.equal(urlExterna('https://example.com/obra'), 'https://example.com/obra');
});
test('histórico mantém datas locais e preço zero sem inventar consumo', () => {
  assert.equal(dataPainel('2026-08-30'), '30/08/2026');
  assert.equal(dataPainel('invalida'), '');
  const campos = historicoObra({ data_inicio: null, data_fim: null, vezes_consumido: 0, onde_consumi: '', valor_pago: 0 });
  assert.equal(campos.length, 1);
  assert.equal(campos[0].label, 'Valor pago');
});
test('painel usa tokens, janela limitada e rolagem central, inclusive movimento reduzido', () => {
  const css = readFileSync(new URL('../components/PainelDetalheObra.module.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  assert.match(css, /100dvh/);
  assert.match(css, /\.conteudo\s*\{[^}]*min-height: 0;[^}]*overflow: auto/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  const shell = readFileSync(new URL('../components/PainelObraLayout.tsx', import.meta.url), 'utf8');
  assert.match(shell, /dialog\.showModal\(\)/);
  assert.match(shell, /aria-labelledby/);
  assert.match(shell, /onCancel/);
  assert.match(shell, /dialog\.close\(\)/);
  assert.match(shell, /anterior\.focus/);
});
