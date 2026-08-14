'use client';

import { useEffect, useState } from 'react';
import {
  Anime,
  AnimeInput,
  listarAnimes,
  criarAnime,
  atualizarAnime,
  apagarAnime,
} from '@/lib/animes';
import PainelDetalheObra, { CampoInfo } from '@/components/PainelDetalheObra';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import ElencoEditor from '@/components/ElencoEditor';
import OpeningsEndingsEditor from '@/components/OpeningsEndingsEditor';
import TemporadasAnimeEditor from '@/components/TemporadasAnimesEditor';
import ComplementosEditor from '@/components/ComplementosEditor';
import OrdemConsumoEditor from '@/components/OrdemConsumoEditor';
import StarRating from '@/components/StarRating';
import BuscaMetadados from './BuscaMetadados';
import SeletorGenero from '@/components/SeletorGenero';
import BibliotecaBanner from './BibliotecaBanner';
import BibliotecaCard from './BibliotecaCard';
import { sb, getUserId } from '@/lib/supabase';
import { getGeneros, getMapaGenerosDosItens, salvarGenerosDoItem, seedGenerosSeNecessario } from '@/lib/generos';
import type { Genero } from '@/lib/generos';
import { ordenarItensBiblioteca, type OrdenacaoBiblioteca } from '@/lib/biblioteca-ordenacao';
import styles from './BibliotecaSection.module.css';

const STATUS_LABEL: Record<string, string> = {
  quero_ver: 'Quero ver',
  assistindo: 'Assistindo',
  assistido: 'Assistido',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};

const FORM_VAZIO: AnimeInput = {
  nome_original: '',
  nome_traduzido: '',
  status: 'quero_ver',
  sinopse: '',
  diretor: '',
  roteirista: '',
  produtores: '',
  estudio: '',
  distribuidora: '',
  character_designer: '',
  animador_chefe: '',
  compositor: '',
  comentario: '',
  favorito: false,
};

interface AnimesSectionProps {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
  ordenacao: OrdenacaoBiblioteca;
  onOrdenacaoChange: (ordenacao: OrdenacaoBiblioteca) => void;
}

export default function AnimesSection({
  gatilhoAdicionar,
  busca = '',
  onTotalCarregado,
  ordenacao,
  onOrdenacaoChange,
}: AnimesSectionProps) {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<AnimeInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelAnime, setPainelAnime] = useState<Anime | null>(null);
  const [animeParaApagar, setAnimeParaApagar] = useState<string | null>(null);

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [generosSelecionados, setGenerosSelecionados] = useState<string[]>([]);
  const [generosPorItem, setGenerosPorItem] = useState<Record<string, Genero[]>>({});

  async function carregarGenerosDosItens(lista: Anime[]) {
    const userId = await getUserId();
    if (!userId) return;
    await seedGenerosSeNecessario(sb, userId);
    const [generosAtuais, uuidsPorItem] = await Promise.all([
      getGeneros(sb, userId),
      getMapaGenerosDosItens(sb, userId, 'animes', lista.map((item) => item.uuid)),
    ]);
    setGeneros(generosAtuais);
    const generosPorUuid = new Map(generosAtuais.map((genero) => [genero.uuid, genero]));
    const mapa: Record<string, Genero[]> = {};
    for (const item of lista) {
      mapa[item.uuid] = (uuidsPorItem[item.uuid] ?? [])
        .map((uid) => generosPorUuid.get(uid))
        .filter((g): g is Genero => g != null);
    }
    setGenerosPorItem(mapa);
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarAnimes();
    if (resultado === null) {
      setErro('Não foi possível carregar os animes.');
    } else {
      setAnimes(resultado);
      onTotalCarregado?.(resultado.length);
      await carregarGenerosDosItens(resultado);
    }
    setCarregando(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (gatilhoAdicionar > 0) abrirNovo();
  }, [gatilhoAdicionar]);

  function abrirNovo() {
    setEditandoUuid(null);
    setForm(FORM_VAZIO);
    setGenerosSelecionados([]);
    setModalAberto(true);
  }

  function abrirEdicao(anime: Anime) {
    setEditandoUuid(anime.uuid);
    setForm({
      nome_original: anime.nome_original,
      nome_traduzido: anime.nome_traduzido ?? '',
      status: anime.status,
      nota: anime.nota ?? undefined,
      sinopse: anime.sinopse ?? '',
      ano_lancamento: anime.ano_lancamento ?? undefined,
      ano_termino: anime.ano_termino ?? undefined,
      duracao_minutos: anime.duracao_minutos ?? undefined,
      diretor: anime.diretor ?? '',
      roteirista: anime.roteirista ?? '',
      produtores: anime.produtores ?? '',
      estudio: anime.estudio ?? '',
      distribuidora: anime.distribuidora ?? '',
      character_designer: anime.character_designer ?? '',
      animador_chefe: anime.animador_chefe ?? '',
      compositor: anime.compositor ?? '',
      comentario: anime.comentario ?? '',
      favorito: anime.favorito,
    });
    setGenerosSelecionados(generosPorItem[anime.uuid]?.map((g) => g.uuid) ?? []);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoUuid(null);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_original?.trim()) return;

    setSalvando(true);
    const resultado = editandoUuid
      ? await atualizarAnime(editandoUuid, form)
      : await criarAnime(form);

    if (resultado === null) {
      setErro('Não foi possível salvar o anime.');
    } else {
      const userId = await getUserId();
      const { error: erroGeneros } = userId
        ? await salvarGenerosDoItem(sb, userId, 'animes', resultado.uuid, generosSelecionados)
        : { error: 'Sessão indisponível' };
      fecharModal();
      await carregar();
      if (erroGeneros) setErro('Anime salvo, mas não foi possível salvar os gêneros.');
    }
    setSalvando(false);
  }

  async function confirmarExclusao() {
    if (!animeParaApagar) return;
    const ok = await apagarAnime(animeParaApagar);
    if (!ok) {
      setErro('Não foi possível apagar o anime.');
    } else {
      await carregar();
    }
  }

  async function alternarFavorito(anime: Anime) {
    const atualizado = await atualizarAnime(anime.uuid, {
      nome_original: anime.nome_original,
      favorito: !anime.favorito,
    });
    if (!atualizado) {
      setErro('Não foi possível atualizar o favorito.');
      return;
    }
    setAnimes((atuais) => atuais.map((item) => item.uuid === atualizado.uuid ? atualizado : item));
    setPainelAnime((atual) => atual?.uuid === atualizado.uuid ? atualizado : atual);
  }

  function montarInfoGeral(anime: Anime): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (anime.nome_traduzido) campos.push({ label: 'Nome traduzido', valor: anime.nome_traduzido });
    if (anime.ano_lancamento) {
      const periodo = anime.ano_termino
        ? `${anime.ano_lancamento}–${anime.ano_termino}`
        : `${anime.ano_lancamento}–presente`;
      campos.push({ label: 'Período', valor: periodo });
    }
    campos.push({ label: 'Status', valor: STATUS_LABEL[anime.status] ?? anime.status });
    if (anime.nota != null) campos.push({ label: 'Nota', valor: `${anime.nota} / 5` });
    if (anime.diretor) campos.push({ label: 'Direção', valor: anime.diretor });
    if (anime.estudio) campos.push({ label: 'Estúdio', valor: anime.estudio });
    if (anime.character_designer)
      campos.push({ label: 'Character Designer', valor: anime.character_designer });
    if (anime.animador_chefe)
      campos.push({ label: 'Animador chefe', valor: anime.animador_chefe });
    if (anime.compositor) campos.push({ label: 'Compositor', valor: anime.compositor });
    if (anime.duracao_minutos)
      campos.push({ label: 'Duração/ep', valor: `${anime.duracao_minutos} min` });
    if (anime.sinopse) campos.push({ label: 'Sinopse', valor: anime.sinopse });
    if (anime.comentario) campos.push({ label: 'Comentário', valor: anime.comentario });
    return campos;
  }

  const itensFiltrados = busca
    ? animes.filter((a) => {
        const titulo = (a.nome_traduzido || a.nome_original).toLowerCase();
        return titulo.includes(busca.toLowerCase());
      })
    : animes;
  const itensOrdenados = ordenarItensBiblioteca(itensFiltrados, ordenacao, {
    titulo: (anime) => anime.nome_traduzido || anime.nome_original,
    atualizadoEm: (anime) => anime.updated_at,
    nota: (anime) => anime.nota,
    favorito: (anime) => anime.favorito,
    status: (anime) => anime.status,
  });

  return (
    <>
      <BibliotecaBanner
        titulo="Animes"
        total={animes.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Novo anime"
        capas={animes.map((f) => f.capa_url)}
        imagemFundo="/biblioteca/banners/animes.jpg"
        ordenacao={ordenacao}
        onOrdenacaoChange={onOrdenacaoChange}
      />

      <div className={styles.container}>
        {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : itensOrdenados.length === 0 ? (
        <div className={styles.vazio}>
          <p>{busca ? 'Nenhum anime encontrado para esta busca.' : 'Nenhum anime cadastrado ainda.'}</p>
          {!busca && (
            <button className={styles.btnPrimario} onClick={abrirNovo}>
              Adicionar o primeiro
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {itensOrdenados.map((anime) => (
            <BibliotecaCard
              key={anime.uuid}
              titulo={anime.nome_traduzido || anime.nome_original}
              capaUrl={anime.capa_url}
              favorito={anime.favorito}
              nota={anime.nota}
              ano={anime.ano_lancamento}
              generos={generosPorItem[anime.uuid] ?? []}
              status={anime.status}
              detalhe={anime.duracao_minutos ? `${anime.duracao_minutos} min` : null}
              onClick={() => setPainelAnime(anime)}
              onEditar={() => abrirEdicao(anime)}
              onAlternarFavorito={() => void alternarFavorito(anime)}
              onApagar={() => setAnimeParaApagar(anime.uuid)}
              menuAberto={menuAbertoUuid === anime.uuid}
              onAlternarMenu={() =>
                setMenuAbertoUuid(menuAbertoUuid === anime.uuid ? null : anime.uuid)
              }
            />
          ))}
        </div>
      )}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar anime' : 'Novo anime'}</h2>
              <button className={styles.btnIcon} onClick={fecharModal}>
                ✕
              </button>
            </div>
            <form onSubmit={salvar} className={styles.modalBody}>
              <label>
                Nome original *
                <input
                  required
                  value={form.nome_original}
                  onChange={(e) => setForm({ ...form, nome_original: e.target.value })}
                />
              </label>
              <BuscaMetadados
                fonte="jikan_anime"
                termo={form.nome_original}
                onSelect={(resultado) => setForm((atual) => ({
                  ...atual,
                  nome_original: resultado.titulo,
                  nome_traduzido: resultado.subtitulo ?? atual.nome_traduzido,
                  mal_id: resultado.identificadorExterno ?? atual.mal_id,
                  capa_url: resultado.capaUrl ?? atual.capa_url,
                  ano_lancamento: resultado.ano ?? atual.ano_lancamento,
                  sinopse: resultado.descricao ?? atual.sinopse,
                  estudio: resultado.autor ?? atual.estudio,
                  link_mal: resultado.linkOficial ?? atual.link_mal,
                  duracao_minutos: resultado.duracaoMinutos ?? atual.duracao_minutos,
                }))}
              />
              <label>
                Nome traduzido
                <input
                  value={form.nome_traduzido ?? ''}
                  onChange={(e) => setForm({ ...form, nome_traduzido: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status ?? 'quero_ver'}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as AnimeInput['status'] })
                  }
                >
                  <option value="quero_ver">Quero ver</option>
                  <option value="assistindo">Assistindo</option>
                  <option value="assistido">Assistido</option>
                  <option value="pausado">Pausado</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </label>
              <StarRating
                value={form.nota}
                onChange={(nota) => setForm({ ...form, nota: nota ?? undefined })}
              />
              <label>
                Ano de lançamento
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_lancamento ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_lancamento:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.favorito ?? false}
                  onChange={(e) => setForm({ ...form, favorito: e.target.checked })}
                />
                Favorito
              </label>
              <label>
                Ano de término (vazio = em andamento)
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_termino ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_termino: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Duração média por episódio (min)
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.duracao_minutos ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duracao_minutos:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--texto-secundario)', marginBottom: '0.4rem' }}>
                  Gêneros
                </div>
                <SeletorGenero
                  generos={generos}
                  selecionados={generosSelecionados}
                  onChange={setGenerosSelecionados}
                />
              </div>
              <label>
                Direção
                <input
                  value={form.diretor ?? ''}
                  onChange={(e) => setForm({ ...form, diretor: e.target.value })}
                />
              </label>
              <label>
                Roteirista
                <input
                  value={form.roteirista ?? ''}
                  onChange={(e) => setForm({ ...form, roteirista: e.target.value })}
                />
              </label>
              <label>
                Produtores
                <input
                  value={form.produtores ?? ''}
                  onChange={(e) => setForm({ ...form, produtores: e.target.value })}
                />
              </label>
              <label>
                Estúdio
                <input
                  value={form.estudio ?? ''}
                  onChange={(e) => setForm({ ...form, estudio: e.target.value })}
                />
              </label>
              <label>
                Distribuidora
                <input
                  value={form.distribuidora ?? ''}
                  onChange={(e) => setForm({ ...form, distribuidora: e.target.value })}
                />
              </label>
              <label>
                Character Designer
                <input
                  value={form.character_designer ?? ''}
                  onChange={(e) => setForm({ ...form, character_designer: e.target.value })}
                />
              </label>
              <label>
                Animador chefe
                <input
                  value={form.animador_chefe ?? ''}
                  onChange={(e) => setForm({ ...form, animador_chefe: e.target.value })}
                />
              </label>
              <label>
                Compositor
                <input
                  value={form.compositor ?? ''}
                  onChange={(e) => setForm({ ...form, compositor: e.target.value })}
                />
              </label>
              <label>
                Sinopse
                <textarea
                  value={form.sinopse ?? ''}
                  onChange={(e) => setForm({ ...form, sinopse: e.target.value })}
                  rows={3}
                />
              </label>
              <label>
                Comentário
                <textarea
                  value={form.comentario ?? ''}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  rows={3}
                />
              </label>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnGhost} onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimario} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>

            {editandoUuid && (
              <div className={styles.modalBody}>
                <TemporadasAnimeEditor animeUuid={editandoUuid} />
                <ElencoEditor tipoObra="anime" obraUuid={editandoUuid} />
                <OpeningsEndingsEditor animeUuid={editandoUuid} />
                <ComplementosEditor animeUuid={editandoUuid} />
                <OrdemConsumoEditor animeUuid={editandoUuid} />
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={animeParaApagar !== null}
        title="Apagar anime?"
        description="O anime deixará de aparecer na Biblioteca. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setAnimeParaApagar(null);
        }}
        onConfirm={confirmarExclusao}
      />

      {painelAnime && (
        <PainelDetalheObra
          aberto={!!painelAnime}
          onFechar={() => setPainelAnime(null)}
          tipoObra="anime"
          obraUuid={painelAnime.uuid}
          titulo={painelAnime.nome_traduzido || painelAnime.nome_original}
          bannerUrl={painelAnime.banner_url}
          capaUrl={painelAnime.capa_url}
          infoGeral={montarInfoGeral(painelAnime)}
         />
      )}
    </div>  
    </>
  );
}
