'use client';

import { useEffect, useState } from 'react';
import {
  listarOrdemConsumo,
  criarItemOrdemConsumo,
  apagarItemOrdemConsumo,
  atualizarOrdemConsumo,
  OrdemConsumoItem,
  TipoReferenciaOrdem,
} from '@/lib/animes-ordem-consumo';
import { listarTemporadasAnime, AnimeTemporada } from '@/lib/animes-temporadas';
import { listarComplementosDoAnime, Filme } from '@/lib/filmes';
import styles from './ListaEditavel.module.css';

interface Props {
  animeUuid: string;
}

export default function OrdemConsumoEditor({ animeUuid }: Props) {
  const [itens, setItens] = useState<OrdemConsumoItem[]>([]);
  const [temporadas, setTemporadas] = useState<AnimeTemporada[]>([]);
  const [complementos, setComplementos] = useState<Filme[]>([]);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoReferenciaOrdem>('temporada');
  const [referenciaSelecionada, setReferenciaSelecionada] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const [ordemRes, temporadasRes, complementosRes] = await Promise.all([
      listarOrdemConsumo(animeUuid),
      listarTemporadasAnime(animeUuid),
      listarComplementosDoAnime(animeUuid),
    ]);
    setItens(ordemRes ?? []);
    setTemporadas(temporadasRes ?? []);
    setComplementos(complementosRes ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeUuid]);

  const opcoesReferencia =
    tipoSelecionado === 'temporada'
      ? temporadas.map((t) => ({ uuid: t.uuid, rotulo: t.nome_original || `Temporada ${t.numero}` }))
      : complementos.map((c) => ({ uuid: c.uuid, rotulo: `Complemento: ${c.titulo}` }));

  async function adicionar() {
    const escolhida = opcoesReferencia.find((o) => o.uuid === referenciaSelecionada);
    if (!escolhida) return;
    setSalvando(true);
    const criado = await criarItemOrdemConsumo(animeUuid, {
      tipo_referencia: tipoSelecionado,
      referencia_uuid: escolhida.uuid,
      rotulo: escolhida.rotulo,
      ordem: itens.length,
    });
    if (criado) {
      setReferenciaSelecionada('');
      await carregar();
    }
    setSalvando(false);
  }

  async function remover(uuid: string) {
    await apagarItemOrdemConsumo(uuid);
    await carregar();
  }

  async function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= itens.length) return;
    const atual = itens[indice];
    const vizinho = itens[destino];
    await Promise.all([
      atualizarOrdemConsumo(atual.uuid, vizinho.ordem),
      atualizarOrdemConsumo(vizinho.uuid, atual.ordem),
    ]);
    await carregar();
  }

  return (
    <div className={styles.wrapper}>
      <h4>Ordem de consumo</h4>
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ol className={styles.timeline}>
          {itens.map((item, i) => (
            <li key={item.uuid}>
              <span className={styles.timelineMarcador}>{i + 1}</span>
              <span className={styles.timelineConteudo}><strong>{item.rotulo}</strong><small>{item.tipo_referencia === 'temporada' ? 'Temporada' : 'Complemento'}</small></span>
              <span className={styles.timelineAcoes}>
                <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Mover para cima">↑</button>
                <button type="button" onClick={() => mover(i, 1)} disabled={i === itens.length - 1} aria-label="Mover para baixo">↓</button>
                <button type="button" onClick={() => remover(item.uuid)} aria-label="Remover da ordem">✕</button>
              </span>
            </li>
          ))}
          {itens.length === 0 && (
            <li className={styles.vazio}>Nenhum item na ordem ainda.</li>
          )}
        </ol>
      )}

      <div className={styles.linhaAdicionar}>
        <select
          value={tipoSelecionado}
          onChange={(e) => {
            setTipoSelecionado(e.target.value as TipoReferenciaOrdem);
            setReferenciaSelecionada('');
          }}
        >
          <option value="temporada">Temporada</option>
          <option value="complemento">Complemento</option>
        </select>
        <select
          value={referenciaSelecionada}
          onChange={(e) => setReferenciaSelecionada(e.target.value)}
        >
          <option value="">Selecione...</option>
          {opcoesReferencia.map((o) => (
            <option key={o.uuid} value={o.uuid}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={adicionar}
          disabled={salvando || !referenciaSelecionada}
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
}
