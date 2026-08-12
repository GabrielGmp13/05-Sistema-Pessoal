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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import VolumesEditor from '@/components/VolumesEditor';
import SeletorGenero from '@/components/SeletorGenero';
import BibliotecaBanner from './BibliotecaBanner';
import BibliotecaCard from './BibliotecaCard';
import BuscaMetadados from './BuscaMetadados';
import { sb, getUserId } from '@/lib/supabase';
import { getGeneros, getMapaGenerosDosItens, salvarGenerosDoItem, seedGenerosSeNecessario } from '@/lib/generos';
import type { Genero } from '@/lib/generos';
import styles from './BibliotecaSection.module.css';

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

interface MangasSectionProps {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
}

export default function MangasSection({ gatilhoAdicionar, busca = '', onTotalCarregado }: MangasSectionProps) {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<MangaInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelManga, setPainelManga] = useState<Manga | null>(null);
  const [mangaParaApagar, setMangaParaApagar] = useState<string | null>(null);

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [generosSelecionados, setGenerosSelecionados] = useState<string[]>([]);
  const [generosPorItem, setGenerosPorItem] = useState<Record<string, Genero[]>>({});

  async function carregarGenerosDosItens(lista: Manga[]) {
    const userId = await getUserId();
    if (!userId) return;
    await seedGenerosSeNecessario(sb, userId);
    const [generosAtuais, uuidsPorItem] = await Promise.all([
      getGeneros(sb, userId),
      getMapaGenerosDosItens(sb, userId, 'mangas', lista.map((item) => item.uuid)),
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
    const resultado = await listarMangas();
    if (resultado === null) {
      setErro('Não foi possível carregar os mangás.');
    } else {
      setMangas(resultado);
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
    setGenerosSelecionados(generosPorItem[manga.uuid]?.map((g) => g.uuid) ?? []);
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
      const userId = await getUserId();
      const { error: erroGeneros } = userId
        ? await salvarGenerosDoItem(sb, userId, 'mangas', resultado.uuid, generosSelecionados)
        : { error: 'Sessão indisponível' };
      fecharModal();
      await carregar();
      if (erroGeneros) setErro('Mangá salvo, mas não foi possível salvar os gêneros.');
    }
    setSalvando(false);
  }

  async function confirmarExclusao() {
    if (!mangaParaApagar) return;
    const ok = await apagarManga(mangaParaApagar);
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
    if (manga.nota != null) campos.push({ label: 'Nota', valor: `${manga.nota} / 10` });
    if (manga.comentario) campos.push({ label: 'Comentário', valor: manga.comentario });
    return campos;
  }

  const itensFiltrados = busca
    ? mangas.filter((m) => m.titulo.toLowerCase().includes(busca.toLowerCase()))
    : mangas;

  return (
    <>
      <BibliotecaBanner
        titulo="Mangas"
        total={mangas.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Novo mangá"
        capas={mangas.map((m) => m.capa_url)}
        imagemFundo="/biblioteca/banners/mangas.jpg"
      />

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : itensFiltrados.length === 0 ? (
        <div className={styles.vazio}>
          <p>{busca ? 'Nenhum mangá encontrado para esta busca.' : 'Nenhum mangá cadastrado ainda.'}</p>
          {!busca && (
            <button className={styles.btnPrimario} onClick={abrirNovo}>
              Adicionar o primeiro
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {itensFiltrados.map((manga) => (
            <BibliotecaCard
              key={manga.uuid}
              titulo={manga.titulo}
              capaUrl={manga.capa_url}
              favorito={manga.favorito}
              nota={manga.nota}
              ano={manga.ano_inicio_publicacao}
              generos={generosPorItem[manga.uuid] ?? []}
              onClick={() => setPainelManga(manga)}
              onEditar={() => abrirEdicao(manga)}
              onApagar={() => setMangaParaApagar(manga.uuid)}
              menuAberto={menuAbertoUuid === manga.uuid}
              onAlternarMenu={() =>
                setMenuAbertoUuid(menuAbertoUuid === manga.uuid ? null : manga.uuid)
              }
            />
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
              <BuscaMetadados
                fonte="jikan_manga"
                termoInicial={form.titulo}
                onSelect={(resultado) => setForm((atual) => ({
                  ...atual,
                  titulo: resultado.titulo,
                  titulo_traduzido: resultado.subtitulo ?? atual.titulo_traduzido,
                  autor: resultado.autor ?? atual.autor,
                  mal_id: resultado.identificadorExterno ?? atual.mal_id,
                  capa_url: resultado.capaUrl ?? atual.capa_url,
                  ano_inicio_publicacao: resultado.ano ?? atual.ano_inicio_publicacao,
                  link_mal: resultado.linkOficial ?? atual.link_mal,
                }))}
              />
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

            {editandoUuid && (
              <div className={styles.modalBody}>
                <VolumesEditor mangaUuid={editandoUuid} />
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={mangaParaApagar !== null}
        title="Apagar mangá?"
        description="O mangá deixará de aparecer na Biblioteca. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setMangaParaApagar(null);
        }}
        onConfirm={confirmarExclusao}
      />

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
    </>
  );
}
