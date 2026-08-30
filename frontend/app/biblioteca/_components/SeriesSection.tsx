'use client';
import { historicoObra } from '@/components/painel-obra-dados';

import { useEffect, useState } from 'react';
import {
  Serie,
  SerieInput,
  listarSeries,
  criarSerie,
  atualizarSerie,
  apagarSerie,
} from '@/lib/series';
import PainelDetalheObra, { CampoInfo } from '@/components/PainelDetalheObra';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import ElencoEditor from '@/components/ElencoEditor';
import TrilhaSonoraEditor from '@/components/TrilhaSonoraEditor';
import TemporadasEditor from '@/components/TemporadasEditor';
import SeletorGenero from '@/components/SeletorGenero';
import StarRating from '@/components/StarRating';
import BibliotecaBanner from './BibliotecaBanner';
import BuscaMetadados from './BuscaMetadados';
import BibliotecaCard from './BibliotecaCard';
import { sb, getUserId } from '@/lib/supabase';
import { garantirGenerosExternos, getGeneros, getMapaGenerosDosItens, salvarGenerosDoItem, seedGenerosSeNecessario } from '@/lib/generos';
import type { Genero } from '@/lib/generos';
import { importarElencoMetadados } from '@/lib/elenco';
import type { ResultadoMetadados } from '@/lib/biblioteca-metadados';
import { ordenarItensBiblioteca, type OrdenacaoBiblioteca } from '@/lib/biblioteca-ordenacao';
import styles from './BibliotecaSection.module.css';
import CapaUploadField from './CapaUploadField';
import { persistirComCapaEBanner, removerArquivosBiblioteca } from '@/lib/biblioteca-capas';

const STATUS_LABEL: Record<string, string> = {
  quero_ver: 'Quero ver',
  assistindo: 'Assistindo',
  assistido: 'Assistido',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};

const FORM_VAZIO: SerieInput = {
  titulo: '',
  diretor: '',
  status: 'quero_ver',
  comentario: '',
  roteirista: '',
  produtores: '',
  estudio: '',
  favorito: false,
};

interface SeriesSectionProps {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
  ordenacao: OrdenacaoBiblioteca;
  onOrdenacaoChange: (ordenacao: OrdenacaoBiblioteca) => void;
}

export default function SeriesSection({
  gatilhoAdicionar,
  busca = '',
  onTotalCarregado,
  ordenacao,
  onOrdenacaoChange,
}: SeriesSectionProps) {
  const [series, setSeries] = useState<Serie[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<SerieInput>(FORM_VAZIO);
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [arquivoBanner, setArquivoBanner] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelSerie, setPainelSerie] = useState<Serie | null>(null);
  const [serieParaApagar, setSerieParaApagar] = useState<string | null>(null);

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [generosSelecionados, setGenerosSelecionados] = useState<string[]>([]);
  const [generosPorItem, setGenerosPorItem] = useState<Record<string, Genero[]>>({});
  const [elencoImportado, setElencoImportado] = useState<ResultadoMetadados['elenco']>([]);

  async function carregarGenerosDosItens(lista: Serie[]) {
    const userId = await getUserId();
    if (!userId) return;
    await seedGenerosSeNecessario(sb, userId);
    const [generosAtuais, uuidsPorItem] = await Promise.all([
      getGeneros(sb, userId),
      getMapaGenerosDosItens(sb, userId, 'series', lista.map((item) => item.uuid)),
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
    const resultado = await listarSeries();
    if (resultado === null) {
      setErro('Não foi possível carregar as séries.');
    } else {
      setSeries(resultado);
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
    setArquivoCapa(null);
    setArquivoBanner(null);
    setGenerosSelecionados([]);
    setElencoImportado([]);
    setModalAberto(true);
  }

  function abrirEdicao(serie: Serie) {
    setArquivoCapa(null);
    setArquivoBanner(null);
    setEditandoUuid(serie.uuid);
    setForm({
      titulo: serie.titulo,
      diretor: serie.diretor ?? '',
      status: serie.status,
      comentario: serie.comentario ?? '',
      nota: serie.nota ?? undefined,
      temporada_atual: serie.temporada_atual,
      episodio_atual: serie.episodio_atual,
      roteirista: serie.roteirista ?? '',
      produtores: serie.produtores ?? '',
      estudio: serie.estudio ?? '',
      ano_lancamento: serie.ano_lancamento ?? undefined,
      ano_termino: serie.ano_termino ?? undefined,
      duracao_minutos: serie.duracao_minutos ?? undefined,
      favorito: serie.favorito,
    });
    setGenerosSelecionados(generosPorItem[serie.uuid]?.map((g) => g.uuid) ?? []);
    setElencoImportado([]);
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
    const atual = editandoUuid ? series.find((serie) => serie.uuid === editandoUuid) : null;
    const persistencia = await persistirComCapaEBanner({ categoria: 'series', arquivoCapa, arquivoBanner, capaPathAtual: atual?.capa_path, bannerPathAtual: atual?.banner_path, persistir: ({ capaPath, bannerPath }) => {
      const dados = { ...form, ...(capaPath ? { capa_path: capaPath } : {}), ...(bannerPath ? { banner_path: bannerPath } : {}) };
      return editandoUuid ? atualizarSerie(editandoUuid, dados) : criarSerie(dados);
    }});
    const resultado = persistencia.resultado;

    if (resultado === null) {
      setErro(persistencia.erro ?? 'Não foi possível salvar a série.');
    } else {
      const userId = await getUserId();
      const { error: erroGeneros } = userId
        ? await salvarGenerosDoItem(sb, userId, 'series', resultado.uuid, generosSelecionados)
        : { error: 'Sessão indisponível' };
      const elencoOk = await importarElencoMetadados('serie', resultado.uuid, elencoImportado ?? []);
      fecharModal();
      await carregar();
      if (erroGeneros || !elencoOk) setErro('Série salva, mas parte dos gêneros ou do elenco não pôde ser importada.');
    }
    setSalvando(false);
  }

  function montarInfoGeral(serie: Serie): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (serie.diretor) campos.push({ label: 'Criação', valor: serie.diretor });
    if (serie.ano_lancamento) {
      const periodo = serie.ano_termino
        ? `${serie.ano_lancamento}–${serie.ano_termino}`
        : `${serie.ano_lancamento}–presente`;
      campos.push({ label: 'Período', valor: periodo });
    }
    campos.push({ label: 'Status', valor: STATUS_LABEL[serie.status] ?? serie.status });
    campos.push({
      label: 'Progresso',
      valor: `T${serie.temporada_atual} · Ep ${serie.episodio_atual}`,
    });
    if (serie.nota != null) campos.push({ label: 'Nota', valor: `${serie.nota} / 5` });
    if (serie.roteirista) campos.push({ label: 'Roteiro', valor: serie.roteirista });
    if (serie.produtores) campos.push({ label: 'Produção', valor: serie.produtores });
    if (serie.estudio) campos.push({ label: 'Estúdio', valor: serie.estudio });
    if (serie.duracao_minutos)
      campos.push({ label: 'Duração/ep', valor: `${serie.duracao_minutos} min` });
    if (serie.comentario) campos.push({ label: 'Comentário', valor: serie.comentario });
    return [...campos, ...historicoObra(serie)];
  }

  async function confirmarExclusao() {
    if (!serieParaApagar) return;
    const removida = series.find((item) => item.uuid === serieParaApagar);
    const ok = await apagarSerie(serieParaApagar);
    if (!ok) {
      setErro('Não foi possível apagar a série.');
    } else {
      if (removida) await removerArquivosBiblioteca([removida.capa_path, removida.banner_path]);
      await carregar();
    }
  }

  async function alternarFavorito(serie: Serie) {
    const atualizada = await atualizarSerie(serie.uuid, {
      titulo: serie.titulo,
      favorito: !serie.favorito,
    });
    if (!atualizada) {
      setErro('Não foi possível atualizar o favorito.');
      return;
    }
    setSeries((atuais) => atuais.map((item) => item.uuid === atualizada.uuid ? atualizada : item));
    setPainelSerie((atual) => atual?.uuid === atualizada.uuid ? atualizada : atual);
  }

  const itensFiltrados = busca
    ? series.filter((s) => s.titulo.toLowerCase().includes(busca.toLowerCase()))
    : series;
  const itensOrdenados = ordenarItensBiblioteca(itensFiltrados, ordenacao, {
    titulo: (serie) => serie.titulo,
    atualizadoEm: (serie) => serie.updated_at,
    nota: (serie) => serie.nota,
    favorito: (serie) => serie.favorito,
    status: (serie) => serie.status,
  });

  return (
    <>
      <BibliotecaBanner
        titulo="Séries"
        total={series.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Nova série"
        capas={series.map((f) => f.capa_url)}
        imagemFundo="/biblioteca/banners/series.jpg"
        ordenacao={ordenacao}
        onOrdenacaoChange={onOrdenacaoChange}
      />

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : itensOrdenados.length === 0 ? (
        <div className={styles.vazio}>
          <p>{busca ? 'Nenhuma série encontrada para esta busca.' : 'Nenhuma série cadastrada ainda.'}</p>
          {!busca && (
            <button className={styles.btnPrimario} onClick={abrirNovo}>
              Adicionar a primeira
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {itensOrdenados.map((serie) => (
            <BibliotecaCard
              key={serie.uuid}
              titulo={serie.titulo}
              capaUrl={serie.capa_url}
              capaPath={serie.capa_path}
              favorito={serie.favorito}
              nota={serie.nota}
              ano={serie.ano_lancamento}
              generos={generosPorItem[serie.uuid] ?? []}
              status={serie.status}
              detalhe={serie.duracao_minutos ? `${serie.duracao_minutos} min` : null}
              onClick={() => setPainelSerie(serie)}
              onEditar={() => abrirEdicao(serie)}
              onAlternarFavorito={() => void alternarFavorito(serie)}
              onApagar={() => setSerieParaApagar(serie.uuid)}
              menuAberto={menuAbertoUuid === serie.uuid}
              onAlternarMenu={() =>
                setMenuAbertoUuid(menuAbertoUuid === serie.uuid ? null : serie.uuid)
              }
            />
          ))}
        </div>
      )}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar série' : 'Nova série'}</h2>
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
              <BuscaMetadados
                fonte="tmdb_serie"
                termo={form.titulo}
                onSelect={(resultado) => {
                  setForm((atual) => ({
                  ...atual,
                  titulo: resultado.titulo,
                  tmdb_id: resultado.identificadorExterno ?? atual.tmdb_id,
                  capa_url: resultado.capaUrl ?? atual.capa_url,
                  banner_url: resultado.bannerUrl ?? atual.banner_url,
                  ano_lancamento: resultado.ano ?? atual.ano_lancamento,
                  ano_termino: resultado.anoTermino ?? atual.ano_termino,
                  duracao_minutos: resultado.duracaoMinutos ?? atual.duracao_minutos,
                  diretor: resultado.diretor ?? atual.diretor,
                  roteirista: resultado.roteirista ?? atual.roteirista,
                  produtores: resultado.produtores ?? atual.produtores,
                  estudio: resultado.estudio ?? atual.estudio,
                  classificacao_indicativa: resultado.classificacaoIndicativa ?? atual.classificacao_indicativa,
                  }));
                  setElencoImportado(resultado.elenco ?? []);
                  if (resultado.generos?.length) void (async () => {
                    const userId = await getUserId();
                    if (!userId) return;
                    const resolvidos = await garantirGenerosExternos(sb, userId, resultado.generos!);
                    setGeneros(resolvidos.generos);
                    setGenerosSelecionados(resolvidos.selecionados);
                  })();
                }}
              />
              <CapaUploadField arquivo={arquivoCapa} onChange={setArquivoCapa} />
              <CapaUploadField arquivo={arquivoBanner} onChange={setArquivoBanner} label="Banner do dispositivo" />
              <label>
                Criação
                <input
                  value={form.diretor ?? ''}
                  onChange={(e) => setForm({ ...form, diretor: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status ?? 'quero_ver'}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as SerieInput['status'] })
                  }
                >
                  <option value="quero_ver">Quero ver</option>
                  <option value="assistindo">Assistindo</option>
                  <option value="assistido">Assistido</option>
                  <option value="pausado">Pausado</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </label>
              <label>
                Temporada atual
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.temporada_atual ?? 1}
                  onChange={(e) =>
                    setForm({ ...form, temporada_atual: Number(e.target.value) })
                  }
                />
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
              <label>
                Ano de término (vazio = em andamento)
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_termino ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_termino:
                        e.target.value === '' ? undefined : Number(e.target.value),
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
                  onChange={(e) => setForm({
                    ...form,
                    duracao_minutos: e.target.value === '' ? undefined : Number(e.target.value),
                  })}
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
                <TemporadasEditor serieUuid={editandoUuid} />
                <ElencoEditor tipoObra="serie" obraUuid={editandoUuid} />
                <TrilhaSonoraEditor tipoObra="serie" obraUuid={editandoUuid} />
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={serieParaApagar !== null}
        title="Apagar série?"
        description="A série deixará de aparecer na Biblioteca. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setSerieParaApagar(null);
        }}
        onConfirm={confirmarExclusao}
      />

      {painelSerie && (
        <PainelDetalheObra
          aberto={!!painelSerie}
          onFechar={() => setPainelSerie(null)}
          onEditar={() => abrirEdicao(painelSerie)}
          favorito={painelSerie.favorito}
          generos={(generosPorItem[painelSerie.uuid] ?? []).map(g => g.nome)}
          links={[{ label: 'IMDb', url: painelSerie.link_imdb }, { label: 'Site oficial', url: painelSerie.link_oficial }]}
          tipoObra="serie"
          obraUuid={painelSerie.uuid}
          titulo={painelSerie.titulo}
          bannerUrl={painelSerie.banner_url}
          bannerPath={painelSerie.banner_path}
          capaUrl={painelSerie.capa_url}
          capaPath={painelSerie.capa_path}
          infoGeral={montarInfoGeral(painelSerie)}
        />
      )}  
    </>
  );
}
