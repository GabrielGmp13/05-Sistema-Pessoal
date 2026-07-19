'use client';

import { useEffect, useState } from 'react';
import {
  Manga,
  MangaInput,
  listarMangas,
  criarManga,
  atualizarManga,
  apagarManga,
} from '@/lib/mangas';
import PainelSimples from '@/components/PainelSimples';
import { CampoInfo } from '@/components/PainelDetalheObra';
import VolumesEditor from '@/components/VolumesEditor';
import styles from '../filmes/page.module.css';

const STATUS_LABEL: Record<string, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};

const STATUS_PUB_LABEL: Record<string, string> = {
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  hiato: 'Em hiato',
  cancelada: 'Cancelada',
};

const FORM_VAZIO: MangaInput = {
  titulo: '',
  titulo_traduzido: '',
  autor: '',
  status: 'quero_ler',
  status_publicacao: 'em_andamento',
  editora: '',
  comentario: '',
};

export default function MangasPage() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<MangaInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelManga, setPainelManga] = useState<Manga | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarMangas();
    if (resultado === null) {
      setErro('Não foi possível carregar os mangás.');
    } else {
      setMangas(resultado);
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

  function abrirEdicao(manga: Manga) {
    setEditandoUuid(manga.uuid);
    setForm({
      titulo: manga.titulo,
      titulo_traduzido: manga.titulo_traduzido ?? '',
      autor: manga.autor ?? '',
      status: manga.status,
      status_publicacao: manga.status_publicacao,
      editora: manga.editora ?? '',
      nota: manga.nota ?? undefined,
      capitulo_atual: manga.capitulo_atual,
      ano_inicio_publicacao: manga.ano_inicio_publicacao ?? undefined,
      ano_fim_publicacao: manga.ano_fim_publicacao ?? undefined,
      comentario: manga.comentario ?? '',
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
      ? await atualizarManga(editandoUuid, form)
      : await criarManga(form);

    if (resultado === null) {
      setErro('Não foi possível salvar o mangá.');
    } else {
      fecharModal();
      await carregar();
    }
    setSalvando(false);
  }

  async function confirmarExclusao(uuid: string) {
    if (!confirm('Apagar este mangá?')) return;
    // TODO(BACKLOG): trocar confirm() nativo por modal .open
    const ok = await apagarManga(uuid);
    if (!ok) {
      setErro('Não foi possível apagar o mangá.');
    } else {
      await carregar();
    }
  }

  function montarInfoGeral(manga: Manga): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (manga.titulo_traduzido)
      campos.push({ label: 'Título traduzido', valor: manga.titulo_traduzido });
    if (manga.autor) campos.push({ label: 'Autor', valor: manga.autor });
    if (manga.editora) campos.push({ label: 'Editora', valor: manga.editora });
    campos.push({ label: 'Status', valor: STATUS_LABEL[manga.status] ?? manga.status });
    campos.push({
      label: 'Publicação',
      valor: STATUS_PUB_LABEL[manga.status_publicacao] ?? manga.status_publicacao,
    });
    if (manga.ano_inicio_publicacao) {
      const periodo = manga.ano_fim_publicacao
        ? `${manga.ano_inicio_publicacao}–${manga.ano_fim_publicacao}`
        : `${manga.ano_inicio_publicacao}–presente`;
      campos.push({ label: 'Período de publicação', valor: periodo });
    }
    campos.push({ label: 'Capítulo atual', valor: String(manga.capitulo_atual) });
    if (manga.nota != null) campos.push({ label: 'Nota', valor: `${manga.nota} / 5` });
    if (manga.comentario) campos.push({ label: 'Comentário', valor: manga.comentario });
    return campos;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mangás</h1>
        <button className={styles.btnPrimario} onClick={abrirNovo}>
          + Novo mangá
        </button>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : mangas.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum mangá cadastrado ainda.</p>
          <button className={styles.btnPrimario} onClick={abrirNovo}>
            Adicionar o primeiro
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {mangas.map((manga) => (
            <div key={manga.uuid} className={styles.card}>
              <div className={styles.cardClicavel} onClick={() => setPainelManga(manga)}>
                <div className={styles.cardHeader}>
                  <h3>{manga.titulo}</h3>
                </div>
                {manga.autor && <p className={styles.meta}>{manga.autor}</p>}
                <p className={styles.badge}>{STATUS_LABEL[manga.status] ?? manga.status}</p>
                <p className={styles.meta}>Cap. {manga.capitulo_atual}</p>
              </div>

              <div className={styles.menuWrapper}>
                <button
                  className={styles.btnIcon}
                  onClick={() =>
                    setMenuAbertoUuid(menuAbertoUuid === manga.uuid ? null : manga.uuid)
                  }
                  title="Ações"
                >
                  ⋯
                </button>
                {menuAbertoUuid === manga.uuid && (
                  <div className={styles.menuDropdown}>
                    <button
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        abrirEdicao(manga);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.menuItemPerigo}
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        confirmarExclusao(manga.uuid);
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
              <h2>{editandoUuid ? 'Editar mangá' : 'Novo mangá'}</h2>
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
                Título traduzido
                <input
                  value={form.titulo_traduzido ?? ''}
                  onChange={(e) => setForm({ ...form, titulo_traduzido: e.target.value })}
                />
              </label>
              <label>
                Autor
                <input
                  value={form.autor ?? ''}
                  onChange={(e) => setForm({ ...form, autor: e.target.value })}
                />
              </label>
              <label>
                Editora
                <input
                  value={form.editora ?? ''}
                  onChange={(e) => setForm({ ...form, editora: e.target.value })}
                />
              </label>
              <label>
                Status (leitura)
                <select
                  value={form.status ?? 'quero_ler'}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as MangaInput['status'] })
                  }
                >
                  <option value="quero_ler">Quero ler</option>
                  <option value="lendo">Lendo</option>
                  <option value="lido">Lido</option>
                  <option value="pausado">Pausado</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </label>
              <label>
                Status (publicação)
                <select
                  value={form.status_publicacao ?? 'em_andamento'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status_publicacao: e.target.value as MangaInput['status_publicacao'],
                    })
                  }
                >
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="hiato">Em hiato</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>
              <label>
                Capítulo atual
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.capitulo_atual ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, capitulo_atual: Number(e.target.value) })
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
                Ano de início da publicação
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_inicio_publicacao ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_inicio_publicacao:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Ano de fim da publicação (vazio = em andamento)
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_fim_publicacao ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_fim_publicacao:
                        e.target.value === '' ? undefined : Number(e.target.value),
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

            {editandoUuid && (
              <div className={styles.modalBody}>
                <VolumesEditor mangaUuid={editandoUuid} />
              </div>
            )}
          </div>
        </div>
      )}

      {painelManga && (
        <PainelSimples
          aberto={!!painelManga}
          onFechar={() => setPainelManga(null)}
          titulo={painelManga.titulo_traduzido || painelManga.titulo}
          bannerUrl={painelManga.banner_url}
          capaUrl={painelManga.capa_url}
          infoGeral={montarInfoGeral(painelManga)}
        />
      )}
    </div>
  );
}