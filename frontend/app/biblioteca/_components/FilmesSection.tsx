'use client';

import { useEffect, useState } from 'react';
import {
  Filme,
  FilmeInput,
  listarFilmes,
  criarFilme,
  atualizarFilme,
  apagarFilme,
} from '@/lib/filmes';
import PainelDetalheObra, { CampoInfo } from '@/components/PainelDetalheObra';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import ElencoEditor from '@/components/ElencoEditor';
import TrilhaSonoraEditor from '@/components/TrilhaSonoraEditor';
import SeletorGenero from '@/components/SeletorGenero';
import StarRating from '@/components/StarRating';
import BibliotecaBanner from './BibliotecaBanner';
import BibliotecaCard from './BibliotecaCard';
import BuscaMetadados from './BuscaMetadados';
import { sb, getUserId } from '@/lib/supabase';
import { getGeneros, getMapaGenerosDosItens, salvarGenerosDoItem, seedGenerosSeNecessario } from '@/lib/generos';
import type { Genero } from '@/lib/generos';
import { ordenarItensBiblioteca, type OrdenacaoBiblioteca } from '@/lib/biblioteca-ordenacao';
import styles from './BibliotecaSection.module.css';
import CapaUploadField from './CapaUploadField';
import { persistirComCapa } from '@/lib/biblioteca-capas';

const STATUS_LABEL: Record<string, string> = {
  quero_ver: 'Quero ver',
  assistido: 'Assistido',
  abandonado: 'Abandonado',
};

const FORM_VAZIO: FilmeInput = {
  titulo: '',
  diretor: '',
  status: 'quero_ver',
  comentario: '',
  roteirista: '',
  produtores: '',
  estudio: '',
  distribuidora: '',
  favorito: false,
};

interface FilmesSectionProps {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
  ordenacao: OrdenacaoBiblioteca;
  onOrdenacaoChange: (ordenacao: OrdenacaoBiblioteca) => void;
}

export default function FilmesSection({
  gatilhoAdicionar,
  busca = '',
  onTotalCarregado,
  ordenacao,
  onOrdenacaoChange,
}: FilmesSectionProps) {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<FilmeInput>(FORM_VAZIO);
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelFilme, setPainelFilme] = useState<Filme | null>(null);
  const [filmeParaApagar, setFilmeParaApagar] = useState<string | null>(null);

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [generosSelecionados, setGenerosSelecionados] = useState<string[]>([]);
  const [generosPorFilme, setGenerosPorFilme] = useState<Record<string, Genero[]>>({});

  async function carregarGenerosDosFilmes(filmesLista: Filme[]) {
    const userId = await getUserId();
    if (!userId) return;
    await seedGenerosSeNecessario(sb, userId);
    const [lista, uuidsPorFilme] = await Promise.all([
      getGeneros(sb, userId),
      getMapaGenerosDosItens(sb, userId, 'filmes', filmesLista.map((filme) => filme.uuid)),
    ]);
    setGeneros(lista);
    const generosPorUuid = new Map(lista.map((genero) => [genero.uuid, genero]));
    const mapa: Record<string, Genero[]> = {};
    for (const f of filmesLista) {
      mapa[f.uuid] = (uuidsPorFilme[f.uuid] ?? [])
        .map((uid) => generosPorUuid.get(uid))
        .filter((g): g is Genero => g != null);
    }
    setGenerosPorFilme(mapa);
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarFilmes();
    if (resultado === null) {
      setErro('Não foi possível carregar os filmes.');
    } else {
      setFilmes(resultado);
      onTotalCarregado?.(resultado.length);
      await carregarGenerosDosFilmes(resultado);
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
    setGenerosSelecionados([]);
    setModalAberto(true);
  }

  function abrirEdicao(filme: Filme) {
    setArquivoCapa(null);
    setEditandoUuid(filme.uuid);
    setForm({
      titulo: filme.titulo,
      diretor: filme.diretor ?? '',
      status: filme.status,
      comentario: filme.comentario ?? '',
      nota: filme.nota ?? undefined,
      roteirista: filme.roteirista ?? '',
      produtores: filme.produtores ?? '',
      estudio: filme.estudio ?? '',
      distribuidora: filme.distribuidora ?? '',
      orcamento: filme.orcamento ?? undefined,
      bilheteria: filme.bilheteria ?? undefined,
      ano_lancamento: filme.ano_lancamento ?? undefined,
      duracao_minutos: filme.duracao_minutos ?? undefined,
      favorito: filme.favorito,
    });
    setGenerosSelecionados(generosPorFilme[filme.uuid]?.map((g) => g.uuid) ?? []);
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
    const atual = editandoUuid ? filmes.find((filme) => filme.uuid === editandoUuid) : null;
    const persistencia = await persistirComCapa({ categoria: 'filmes', arquivo: arquivoCapa, capaPathAtual: atual?.capa_path, persistir: (capaPath) => {
      const dados = capaPath ? { ...form, capa_path: capaPath } : form;
      return editandoUuid ? atualizarFilme(editandoUuid, dados) : criarFilme(dados);
    }});
    const resultado = persistencia.resultado;

    if (resultado === null) {
      setErro(persistencia.erro ?? 'Não foi possível salvar o filme.');
    } else {
      const userId = await getUserId();
      const { error: erroGeneros } = userId
        ? await salvarGenerosDoItem(sb, userId, 'filmes', resultado.uuid, generosSelecionados)
        : { error: 'Sessão indisponível' };
      fecharModal();
      await carregar();
      if (erroGeneros) setErro('Filme salvo, mas não foi possível salvar os gêneros.');
    }
    setSalvando(false);
  }

  function montarInfoGeral(filme: Filme): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (filme.diretor) campos.push({ label: 'Direção', valor: filme.diretor });
    if (filme.ano_lancamento) campos.push({ label: 'Ano', valor: String(filme.ano_lancamento) });
    campos.push({ label: 'Status', valor: STATUS_LABEL[filme.status] ?? filme.status });
    if (filme.nota != null) campos.push({ label: 'Nota', valor: `${filme.nota} / 5` });
    if (filme.roteirista) campos.push({ label: 'Roteiro', valor: filme.roteirista });
    if (filme.produtores) campos.push({ label: 'Produção', valor: filme.produtores });
    if (filme.estudio) campos.push({ label: 'Estúdio', valor: filme.estudio });
    if (filme.distribuidora)
      campos.push({ label: 'Distribuidora', valor: filme.distribuidora });
    if (filme.duracao_minutos)
      campos.push({ label: 'Duração', valor: `${filme.duracao_minutos} min` });
    if (filme.comentario) campos.push({ label: 'Comentário', valor: filme.comentario });
    return campos;
  }

  async function confirmarExclusao() {
    if (!filmeParaApagar) return;
    const ok = await apagarFilme(filmeParaApagar);
    if (!ok) {
      setErro('Não foi possível apagar o filme.');
    } else {
      await carregar();
    }
  }

  async function alternarFavorito(filme: Filme) {
    const atualizado = await atualizarFilme(filme.uuid, {
      titulo: filme.titulo,
      favorito: !filme.favorito,
    });
    if (!atualizado) {
      setErro('Não foi possível atualizar o favorito.');
      return;
    }
    setFilmes((atuais) => atuais.map((item) => item.uuid === atualizado.uuid ? atualizado : item));
    setPainelFilme((atual) => atual?.uuid === atualizado.uuid ? atualizado : atual);
  }

  const filmesFiltrados = busca
    ? filmes.filter((f) => f.titulo.toLowerCase().includes(busca.toLowerCase()))
    : filmes;
  const filmesOrdenados = ordenarItensBiblioteca(filmesFiltrados, ordenacao, {
    titulo: (filme) => filme.titulo,
    atualizadoEm: (filme) => filme.updated_at,
    nota: (filme) => filme.nota,
    favorito: (filme) => filme.favorito,
    status: (filme) => filme.status,
  });

  return (
    <>
      <BibliotecaBanner
        titulo="Filmes"
        total={filmes.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Novo filme"
        capas={filmes.map((f) => f.capa_url)}
        imagemFundo="/biblioteca/banners/filmes.jpg"
        ordenacao={ordenacao}
        onOrdenacaoChange={onOrdenacaoChange}
      />

      <div className={styles.container}>
        {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : filmesOrdenados.length === 0 ? (
        <div className={styles.vazio}>
          <p>{busca ? 'Nenhum filme encontrado para esta busca.' : 'Nenhum filme cadastrado ainda.'}</p>
          {!busca && (
            <button className={styles.btnPrimario} onClick={abrirNovo}>
              Adicionar o primeiro
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filmesOrdenados.map((filme) => (
            <BibliotecaCard
              key={filme.uuid}
              titulo={filme.titulo}
              capaUrl={filme.capa_url}
              capaPath={filme.capa_path}
              favorito={filme.favorito}
              nota={filme.nota}
              ano={filme.ano_lancamento}
              generos={generosPorFilme[filme.uuid] ?? []}
              status={filme.status}
              detalhe={filme.duracao_minutos ? `${filme.duracao_minutos} min` : null}
              onClick={() => setPainelFilme(filme)}
              onEditar={() => abrirEdicao(filme)}
              onAlternarFavorito={() => void alternarFavorito(filme)}
              onApagar={() => setFilmeParaApagar(filme.uuid)}
              menuAberto={menuAbertoUuid === filme.uuid}
              onAlternarMenu={() =>
                setMenuAbertoUuid(menuAbertoUuid === filme.uuid ? null : filme.uuid)
              }
            />
          ))}
        </div>
      )}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar filme' : 'Novo filme'}</h2>
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
                fonte="tmdb_filme"
                termo={form.titulo}
                onSelect={(resultado) => setForm((atual) => ({
                  ...atual,
                  titulo: resultado.titulo,
                  tmdb_id: resultado.identificadorExterno ?? atual.tmdb_id,
                  capa_url: resultado.capaUrl ?? atual.capa_url,
                  banner_url: resultado.bannerUrl ?? atual.banner_url,
                  ano_lancamento: resultado.ano ?? atual.ano_lancamento,
                  duracao_minutos: resultado.duracaoMinutos ?? atual.duracao_minutos,
                  diretor: resultado.diretor ?? atual.diretor,
                  roteirista: resultado.roteirista ?? atual.roteirista,
                  produtores: resultado.produtores ?? atual.produtores,
                  estudio: resultado.estudio ?? atual.estudio,
                  classificacao_indicativa: resultado.classificacaoIndicativa ?? atual.classificacao_indicativa,
                }))}
              />
              <CapaUploadField arquivo={arquivoCapa} onChange={setArquivoCapa} />
              <label>
                Diretor
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
                    setForm({ ...form, status: e.target.value as FilmeInput['status'] })
                  }
                >
                  <option value="quero_ver">Quero ver</option>
                  <option value="assistido">Assistido</option>
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
              <label>
                Duração (min)
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
              {/* Gêneros */}
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
                Distribuidora
                <input
                  value={form.distribuidora ?? ''}
                  onChange={(e) => setForm({ ...form, distribuidora: e.target.value })}
                />
              </label>
              <label>
                Orçamento (R$)
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.orcamento ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      orcamento: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Bilheteria (R$)
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.bilheteria ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bilheteria: e.target.value === '' ? undefined : Number(e.target.value),
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
                <ElencoEditor tipoObra="filme" obraUuid={editandoUuid} />
                <TrilhaSonoraEditor tipoObra="filme" obraUuid={editandoUuid} />
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={filmeParaApagar !== null}
        title="Apagar filme?"
        description="O filme deixará de aparecer na Biblioteca. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setFilmeParaApagar(null);
        }}
        onConfirm={confirmarExclusao}
      />

      {painelFilme && (
        <PainelDetalheObra
          aberto={!!painelFilme}
          onFechar={() => setPainelFilme(null)}
          tipoObra="filme"
          obraUuid={painelFilme.uuid}
          titulo={painelFilme.titulo}
          bannerUrl={painelFilme.banner_url}
          capaUrl={painelFilme.capa_url}
          infoGeral={montarInfoGeral(painelFilme)}
        />
      )}
    </div>  
    </>
  );
}
