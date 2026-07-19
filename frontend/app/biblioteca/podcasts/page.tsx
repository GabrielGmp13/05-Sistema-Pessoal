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
import styles from '../filmes/page.module.css';

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

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<PodcastInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelPodcast, setPainelPodcast] = useState<Podcast | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarPodcasts();
    if (resultado === null) {
      setErro('Não foi possível carregar os podcasts.');
    } else {
      setPodcasts(resultado);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditandoUuid(null);
    setForm(FORM_VAZIO);
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
      fecharModal();
      await carregar();
    }
    setSalvando(false);
  }

  async function confirmarExclusao(uuid: string) {
    if (!confirm('Apagar este podcast?')) return;
    // TODO(BACKLOG): trocar confirm() nativo por modal .open
    const ok = await apagarPodcast(uuid);
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
    if (podcast.nota != null) campos.push({ label: 'Nota', valor: `${podcast.nota} / 5` });
    if (podcast.comentario) campos.push({ label: 'Comentário', valor: podcast.comentario });
    return campos;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Podcasts</h1>
        <button className={styles.btnPrimario} onClick={abrirNovo}>
          + Novo podcast
        </button>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : podcasts.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum podcast cadastrado ainda.</p>
          <button className={styles.btnPrimario} onClick={abrirNovo}>
            Adicionar o primeiro
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {podcasts.map((podcast) => (
            <div key={podcast.uuid} className={styles.card}>
              <div className={styles.cardClicavel} onClick={() => setPainelPodcast(podcast)}>
                <div className={styles.cardHeader}>
                  <h3>{podcast.titulo}</h3>
                </div>
                {podcast.produtora && <p className={styles.meta}>{podcast.produtora}</p>}
                <p className={styles.badge}>{STATUS_LABEL[podcast.status] ?? podcast.status}</p>
                <p className={styles.meta}>Ep. {podcast.episodio_atual}</p>
              </div>

              <div className={styles.menuWrapper}>
                <button
                  className={styles.btnIcon}
                  onClick={() =>
                    setMenuAbertoUuid(menuAbertoUuid === podcast.uuid ? null : podcast.uuid)
                  }
                  title="Ações"
                >
                  ⋯
                </button>
                {menuAbertoUuid === podcast.uuid && (
                  <div className={styles.menuDropdown}>
                    <button
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        abrirEdicao(podcast);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.menuItemPerigo}
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        confirmarExclusao(podcast.uuid);
                      }}
                    >
                      Apagar
                    </button>
                  </div>
                )}
              </div>
            </div>
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
                Nota (0 a 5, meia estrela)
                <input
                  type="number"
                  min={0}
                  max={5}
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
    </div>
  );
}