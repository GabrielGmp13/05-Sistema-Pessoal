'use client';

import { useEffect, useRef, useState } from 'react';
import {
  listarTemporadasAnime,
  criarTemporadaAnime,
  apagarTemporadaAnime,
  atualizarTemporadaAnime,
  AnimeTemporada,
} from '@/lib/animes-temporadas';
import EpisodiosEditor from './EpisodiosEditor';
import BuscaMetadados from '@/app/biblioteca/_components/BuscaMetadados';
import { completarResultadoAniList, type ResultadoMetadados } from '@/lib/biblioteca-metadados';
import { UnoptimizedExternalImage } from '@/components/UnoptimizedExternalImage';
import styles from './ListaEditavel.module.css';
import StarRating from './StarRating';
import { ConfirmDialog } from './ui/confirm-dialog';
import { camposTemporada, dadosEdicaoTemporada, validarEdicaoTemporada, valoresEdicaoTemporada } from '@/lib/temporada-edicao';

interface Props {
  animeUuid: string;
  anilistId?: string | null;
  onChanged?: () => void | Promise<void>;
}

const VAZIO = { numero: '', numero_episodios: '', minha_nota: '' };
const FORMATOS_TEMPORADA = ['TV', 'TV_SHORT'];
const RELACOES_TEMPORADA = ['SEQUEL', 'PREQUEL'];

export default function TemporadasAnimeEditor(props: Props) {
  return <EditorTemporadas key={`${props.animeUuid}:${props.anilistId ?? ''}`} {...props} />;
}

function EditorTemporadas({ animeUuid, anilistId, onChanged }: Props) {
  const [itens, setItens] = useState<AnimeTemporada[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [expandidaUuid, setExpandidaUuid] = useState<string | null>(null);
  const [relacaoSelecionada, setRelacaoSelecionada] = useState<ResultadoMetadados | null>(null);
  const [buscaObra, setBuscaObra] = useState('');
  const [erro, setErro] = useState('');
  const [completando, setCompletando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<Record<string, string>>({});
  const [excluindo, setExcluindo] = useState<AnimeTemporada | null>(null);
  const [listaPronta, setListaPronta] = useState(false);
  const operacao = useRef(false);
  const versaoSelecao = useRef(0);
  useEffect(() => () => { versaoSelecao.current += 1; }, []);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await listarTemporadasAnime(animeUuid);
      if (!res) throw new Error('leitura');
      setItens(res);
      setListaPronta(true);
    } catch {
      setListaPronta(false);
      setErro('Não foi possível carregar as temporadas. Reabra a lista antes de editar.');
    } finally { setCarregando(false); }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeUuid]);

  async function adicionar() {
    const numero = Number(novo.numero);
    if (!relacaoSelecionada || !Number.isInteger(numero) || numero < 1 || completando || salvando || carregando || !listaPronta || operacao.current) return;
    if (itens.some(item => item.numero === numero)) { setErro('Já existe uma temporada com esse número.'); return; }
    operacao.current = true;
    setErro('');
    setSalvando(true);
    try {
    const criada = await criarTemporadaAnime(animeUuid, {
      numero,
      numero_episodios: novo.numero_episodios ? Number(novo.numero_episodios) : undefined,
      minha_nota: novo.minha_nota ? Number(novo.minha_nota) : undefined,
      nome_original: relacaoSelecionada?.titulo,
      nome_traduzido: relacaoSelecionada?.subtitulo,
      capa_url: relacaoSelecionada?.capaUrl,
      sinopse: relacaoSelecionada?.descricao,
      ano_lancamento: relacaoSelecionada?.ano,
      ano_termino: relacaoSelecionada?.anoTermino,
      duracao_minutos: relacaoSelecionada?.duracaoMinutos,
      anilist_id: relacaoSelecionada?.anilistId,
      mal_id: relacaoSelecionada?.malId,
      link_anilist: relacaoSelecionada?.linkOficial,
      link_mal: relacaoSelecionada?.malId ? `https://myanimelist.net/anime/${relacaoSelecionada.malId}` : undefined,
      formato: relacaoSelecionada?.formato,
      tipo_relacao: relacaoSelecionada?.tipoRelacao,
      diretor: relacaoSelecionada?.diretor,
      roteirista: relacaoSelecionada?.roteirista,
      produtores: relacaoSelecionada?.produtores,
      estudio: relacaoSelecionada?.estudio ?? relacaoSelecionada?.autor,
      character_designer: relacaoSelecionada?.characterDesigner,
      animador_chefe: relacaoSelecionada?.animadorChefe,
      compositor: relacaoSelecionada?.compositor,
    });
    if (criada) {
      setNovo(VAZIO);
      setRelacaoSelecionada(null);
      await carregar();
      await onChanged?.();
    } else {
      setErro('Não foi possível adicionar esta temporada. A atualização do banco pode ainda não ter sido aplicada.');
    }
    } catch {
      setListaPronta(false);
      setErro('Não foi possível confirmar a inclusão. Reabra a lista antes de tentar novamente.');
    } finally { setSalvando(false); operacao.current = false; }
  }

  async function selecionarObra(resultado: ResultadoMetadados) {
    const versao = ++versaoSelecao.current;
    setErro('');
    setRelacaoSelecionada(resultado);
    setNovo(VAZIO);
    setBuscaObra('');
    setCompletando(true);
    const completo = await completarResultadoAniList(resultado);
    if (versao !== versaoSelecao.current) return;
    setRelacaoSelecionada(completo);
    setNovo(atual => ({ numero: String(Math.max(0, ...itens.map((item) => item.numero)) + 1), numero_episodios: completo.episodios ? String(completo.episodios) : '', minha_nota: atual.minha_nota }));
    setCompletando(false);
  }

  function trocarObra() {
    versaoSelecao.current += 1;
    setRelacaoSelecionada(null);
    setNovo(VAZIO);
    setCompletando(false);
    setBuscaObra('');
    setErro('');
  }

  async function remover(uuid: string) {
    await executar(async () => Boolean(await apagarTemporadaAnime(uuid)));
    if (expandidaUuid === uuid) setExpandidaUuid(null);
  }

  async function avaliar(item: AnimeTemporada, nota: number | null) {
    await executar(async () => Boolean(await atualizarTemporadaAnime(item.uuid, { numero: item.numero, minha_nota: nota })));
  }

  async function executar(acao: () => Promise<boolean>) {
    if (operacao.current || !listaPronta) return;
    operacao.current = true;
    setSalvando(true);
    setErro('');
    try {
      if (!await acao()) { setErro('Não foi possível salvar a alteração.'); return; }
      setEditando(null);
      await carregar();
      await onChanged?.();
    } catch {
      setListaPronta(false);
      setErro('Não foi possível confirmar a alteração. Reabra a lista antes de tentar novamente.');
    } finally { operacao.current = false; setSalvando(false); }
  }

  async function salvarEdicao() {
    if (!editando) return;
    const erroCampo = validarEdicaoTemporada(edicao);
    if (erroCampo) { setErro(erroCampo); return; }
    if (itens.some(item => item.uuid !== editando && item.numero === Number(edicao.numero))) {
      setErro('Já existe uma temporada com esse número.'); return;
    }
    await executar(async () => Boolean(await atualizarTemporadaAnime(editando, dadosEdicaoTemporada(edicao))));
  }

  return (
    <div className={styles.wrapper}>
      <h4>Temporadas</h4>
      <p className={styles.instrucao}>Pesquise e selecione uma obra. O número, episódios e metadados serão definidos automaticamente.</p>
      {erro ? <p className={styles.erro}>{erro}</p> : null}
      {!relacaoSelecionada ? <>
      <div className={styles.linhaAdicionar}>
        <input aria-label="Pesquisar temporada" placeholder="Pesquisar outra obra para usar como temporada" value={buscaObra} onChange={(e) => setBuscaObra(e.target.value)} />
      </div>
      {buscaObra.trim().length >= 2 ? <BuscaMetadados key={`busca:${buscaObra.trim()}`} fonte="jikan_anime" termo={buscaObra} formatos={FORMATOS_TEMPORADA} onSelect={(resultado) => void selecionarObra(resultado)} /> : anilistId ? (
        <><p className={styles.vazio}>Sugestões relacionadas pela AniList</p><BuscaMetadados
          key={`relacoes:${anilistId}`}
          fonte="anilist_relacoes"
          termo={anilistId}
          formatos={FORMATOS_TEMPORADA}
          relacoes={RELACOES_TEMPORADA}
          onSelect={(resultado) => void selecionarObra(resultado)}
        /></>
      ) : <p className={styles.vazio}>Digite ao menos 2 caracteres para pesquisar uma temporada.</p>}
      </> : <section className={styles.adicaoTemporada} aria-label="Adicionar temporada selecionada">
      <div className={styles.obraSelecionada}>
        {relacaoSelecionada.capaUrl ? <UnoptimizedExternalImage src={relacaoSelecionada.capaUrl} alt="" /> : null}
        <span><strong>{relacaoSelecionada.titulo}</strong>{relacaoSelecionada.subtitulo ? <small>{relacaoSelecionada.subtitulo}</small> : null}<small>{[relacaoSelecionada.formato, relacaoSelecionada.ano, relacaoSelecionada.episodios ? `${relacaoSelecionada.episodios} episódios` : null].filter(Boolean).join(' · ')}</small></span>
      </div>
      {completando && <p className={styles.vazio} role="status">Completando informações da temporada...</p>}
      <div className={styles.confirmarObra}>
        <StarRating label="Minha nota nesta temporada" value={novo.minha_nota ? Number(novo.minha_nota) : null} onChange={(nota) => setNovo(atual => ({ ...atual, minha_nota: nota == null ? '' : String(nota) }))} />
        <button type="button" onClick={adicionar} disabled={salvando || completando || carregando}>{salvando ? 'Adicionando...' : 'Adicionar temporada selecionada'}</button>
      </div>
      <button type="button" className={styles.trocarTemporada} onClick={trocarObra} disabled={salvando}>Escolher outra temporada</button>
      </section>}
      <h5 className={styles.tituloTemporadasSalvas}>Temporadas adicionadas</h5>
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.uuid} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong>{item.nome_original || `Temporada ${item.numero}`}</strong>
                  {item.nome_traduzido ? <small className={styles.rotuloSecundario}>{item.nome_traduzido}</small> : null}
                  {item.numero_episodios != null ? ` — ${item.numero_episodios} eps` : ''}
                </span>
                <span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandidaUuid(expandidaUuid === item.uuid ? null : item.uuid)
                    }
                  >
                    {expandidaUuid === item.uuid ? 'Fechar episódios' : 'Ver episódios'}
                  </button>
                  <button type="button" disabled={salvando || !listaPronta} onClick={() => {
                    setErro(''); setEditando(item.uuid);
                    setEdicao(valoresEdicaoTemporada(item));
                  }}>Editar</button>
                  <button type="button" disabled={salvando || !listaPronta} aria-label={`Remover temporada ${item.numero}`} onClick={() => setExcluindo(item)}>
                    ✕
                  </button>
                </span>
              </div>
              {expandidaUuid === item.uuid && <EpisodiosEditor temporadaUuid={item.uuid} />}
              {editando === item.uuid && <fieldset disabled={salvando}>
                <legend>Editar temporada</legend>
                {camposTemporada.map(campo => <label key={campo.chave}>
                  {campo.rotulo}
                  <input type={campo.numero ? 'number' : campo.url ? 'url' : 'text'} min={campo.min} max={campo.max} step={campo.passo} maxLength={2000} value={edicao[campo.chave] ?? ''} onChange={event => setEdicao(atual => ({ ...atual, [campo.chave]: event.target.value }))} />
                </label>)}
                <label>Data em que assisti<input type="date" value={edicao.data_assisti ?? ''} onChange={event => setEdicao(atual => ({ ...atual, data_assisti: event.target.value }))} /></label>
                <label>Sinopse<textarea value={edicao.sinopse} onChange={event => setEdicao(atual => ({ ...atual, sinopse: event.target.value }))} /></label>
                <button type="button" onClick={() => void salvarEdicao()}>Salvar alterações</button>
                <button type="button" onClick={() => setEditando(null)}>Cancelar</button>
              </fieldset>}
              <StarRating disabled={salvando || !listaPronta || editando !== null} label="Minha nota" value={item.minha_nota} onChange={(nota) => void avaliar(item, nota)} />
            </li>
          ))}
          {itens.length === 0 && <li className={styles.vazio}>Nenhuma temporada ainda.</li>}
        </ul>
      )}
      <ConfirmDialog open={Boolean(excluindo)} title="Remover temporada?" description="A temporada será retirada da lista. Esta ação não exclui permanentemente seus episódios." confirmLabel="Remover" onOpenChange={aberto => { if (!aberto && !salvando) setExcluindo(null); }} onConfirm={async () => { if (excluindo) await remover(excluindo.uuid); setExcluindo(null); }} />
    </div>
  );
}
