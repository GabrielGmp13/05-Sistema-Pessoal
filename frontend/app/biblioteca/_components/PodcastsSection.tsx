'use client';

import { useEffect, useState } from 'react';
import {
  Podcast,
  PodcastInput,
  listarPodcasts,
  criarPodcast,
  atualizarPodcast,
  apagarPodcast,
} from '@/lib/podcasts';
import PainelSimples from '@/components/PainelSimples';
import { CampoInfo } from '@/components/PainelDetalheObra';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import SeletorGenero from '@/components/SeletorGenero';
import BibliotecaBanner from './BibliotecaBanner';
import BibliotecaCard from './BibliotecaCard';
import { sb, getUserId } from '@/lib/supabase';
import { getGeneros, getMapaGenerosDosItens, salvarGenerosDoItem, seedGenerosSeNecessario } from '@/lib/generos';
import type { Genero } from '@/lib/generos';
import styles from './BibliotecaSection.module.css';

const STATUS_LABEL: Record<string, string> = {
  quero_ouvir: 'Quero ouvir',
  ouvindo: 'Ouvindo',
  concluido: 'Concluído',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};

const FORM_VAZIO: PodcastInput = {
  titulo: '',
  produtora: '',
  status: 'quero_ouvir',
  comentario: '',
};

interface PodcastsSectionProps {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
}

export default function PodcastsSection({ gatilhoAdicionar, busca = '', onTotalCarregado }: PodcastsSectionProps) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<PodcastInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelPodcast, setPainelPodcast] = useState<Podcast | null>(null);
  const [podcastParaApagar, setPodcastParaApagar] = useState<string | null>(null);

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [generosSelecionados, setGenerosSelecionados] = useState<string[]>([]);
  const [generosPorItem, setGenerosPorItem] = useState<Record<string, Genero[]>>({});

  async function carregarGenerosDosItens(lista: Podcast[]) {
    const userId = await getUserId();
    if (!userId) return;
    await seedGenerosSeNecessario(sb, userId);
    const [generosAtuais, uuidsPorItem] = await Promise.all([
      getGeneros(sb, userId),
      getMapaGenerosDosItens(sb, userId, 'podcasts', lista.map((item) => item.uuid)),
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
    const resultado = await listarPodcasts();
    if (resultado === null) {
      setErro('Não foi possível carregar os podcasts.');
    } else {
      setPodcasts(resultado);
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

  function abrirEdicao(podcast: Podcast) {
    setEditandoUuid(podcast.uuid);
    setForm({
      titulo: podcast.titulo,
      produtora: podcast.produtora ?? '',
      status: podcast.status,
      nota: podcast.nota ?? undefined,
      episodio_atual: podcast.episodio_atual,
      comentario: podcast.comentario ?? '',
    });
    setGenerosSelecionados(generosPorItem[podcast.uuid]?.map((g) => g.uuid) ?? []);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoUuid(null);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo?.trim()) return;

    setSalvando(true);
    const resultado = editandoUuid
      ? await atualizarPodcast(editandoUuid, form)
      : await criarPodcast(form);

    if (resultado === null) {
      setErro('Não foi possível salvar o podcast.');
    } else {
      const userId = await getUserId();
      const { error: erroGeneros } = userId
        ? await salvarGenerosDoItem(sb, userId, 'podcasts', resultado.uuid, generosSelecionados)
        : { error: 'Sessão indisponível' };
      fecharModal();
      await carregar();
      if (erroGeneros) setErro('Podcast salvo, mas não foi possível salvar os gêneros.');
    }
    setSalvando(false);
  }

  async function confirmarExclusao() {
    if (!podcastParaApagar) return;
    const ok = await apagarPodcast(podcastParaApagar);
    if (!ok) {
      setErro('Não foi possível apagar o podcast.');
    } else {
      await carregar();
    }
  }

  function montarInfoGeral(podcast: Podcast): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (podcast.produtora) campos.push({ label: 'Produtora', valor: podcast.produtora });
    campos.push({ label: 'Status', valor: STATUS_LABEL[podcast.status] ?? podcast.status });
    campos.push({ label: 'Episódio atual', valor: String(podcast.episodio_atual) });
    if (podcast.nota != null) campos.push({ label: 'Nota', valor: `${podcast.nota} / 10` });
    if (podcast.comentario) campos.push({ label: 'Comentário', valor: podcast.comentario });
    return campos;
  }

  const itensFiltrados = busca
    ? podcasts.filter((p) => p.titulo.toLowerCase().includes(busca.toLowerCase()))
    : podcasts;

  return (
    <>
      <BibliotecaBanner
        titulo="Podcasts"
        total={podcasts.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Novo filme"
        capas={podcasts.map((f) => f.capa_url)}
        imagemFundo="/biblioteca/banners/podcasts.jpg"
      />

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : itensFiltrados.length === 0 ? (
        <div className={styles.vazio}>
          <p>{busca ? 'Nenhum podcast encontrado para esta busca.' : 'Nenhum podcast cadastrado ainda.'}</p>
          {!busca && (
            <button className={styles.btnPrimario} onClick={abrirNovo}>
              Adicionar o primeiro
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {itensFiltrados.map((podcast) => (
            <BibliotecaCard
              key={podcast.uuid}
              titulo={podcast.titulo}
              capaUrl={podcast.capa_url}
              favorito={podcast.favorito}
              nota={podcast.nota}
              ano={null} // podcasts não têm campo de ano
              generos={generosPorItem[podcast.uuid] ?? []}
              onClick={() => setPainelPodcast(podcast)}
              onEditar={() => abrirEdicao(podcast)}
              onApagar={() => setPodcastParaApagar(podcast.uuid)}
              menuAberto={menuAbertoUuid === podcast.uuid}
              onAlternarMenu={() =>
                setMenuAbertoUuid(menuAbertoUuid === podcast.uuid ? null : podcast.uuid)
              }
            />
          ))}
        </div>
      )}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar podcast' : 'Novo podcast'}</h2>
              <button className={styles.btnIcon} onClick={fecharModal}>
                ✕
              </button>
            </div>
            <form onSubmit={salvar} className={styles.modalBody}>
              <label>
                Título *
                <input
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </label>
              <label>
                Produtora
                <input
                  value={form.produtora ?? ''}
                  onChange={(e) => setForm({ ...form, produtora: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status ?? 'quero_ouvir'}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as PodcastInput['status'] })
                  }
                >
                  <option value="quero_ouvir">Quero ouvir</option>
                  <option value="ouvindo">Ouvindo</option>
                  <option value="concluido">Concluído</option>
                  <option value="pausado">Pausado</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </label>
              <label>
                Episódio atual
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.episodio_atual ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, episodio_atual: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Nota (0 a 10)
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  inputMode="decimal"
                  value={form.nota ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nota: e.target.value === '' ? undefined : Number(e.target.value),
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
          </div>
        </div>
      )}

      <ConfirmDialog
        open={podcastParaApagar !== null}
        title="Apagar podcast?"
        description="O podcast deixará de aparecer na Biblioteca. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setPodcastParaApagar(null);
        }}
        onConfirm={confirmarExclusao}
      />

      {painelPodcast && (
        <PainelSimples
          aberto={!!painelPodcast}
          onFechar={() => setPainelPodcast(null)}
          titulo={painelPodcast.titulo}
          bannerUrl={painelPodcast.banner_url}
          capaUrl={painelPodcast.capa_url}
          infoGeral={montarInfoGeral(painelPodcast)}
        />
      )}  
    </>
  );
}
